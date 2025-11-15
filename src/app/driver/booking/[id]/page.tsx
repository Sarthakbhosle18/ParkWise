"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock, CreditCard, Banknote } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookingFormData {
  vehicleType: string;
  vehicleNumber: string;
  startTime: string;
  duration: number;
  paymentMethod: string;
}

export default function BookingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const parkingId = params.id as string;

  const [bookingData, setBookingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [duration, setDuration] = useState(1);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      paymentMethod: "cash",
      duration: 1,
    }
  });

  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "driver")) {
      router.push("/auth/driver/login");
      return;
    }

    // Load booking data from localStorage
    const storedData = localStorage.getItem("bookingData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setBookingData(data);
      calculateAmount(1, data);
    } else {
      toast.error("No booking data found");
      router.push("/driver/dashboard");
    }

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user, authLoading, router]);

  const calculateAmount = (hours: number, data: any = bookingData) => {
    if (!data) return;

    let amount = 0;
    if (hours >= 24) {
      const days = Math.ceil(hours / 24);
      amount = days * data.dailyRate;
    } else {
      amount = Math.ceil(hours) * data.hourlyRate;
    }
    setTotalAmount(amount);
  };

  const handleDurationChange = (value: string) => {
    const hours = parseInt(value);
    setDuration(hours);
    setValue("duration", hours);
    calculateAmount(hours);
  };

  const createBooking = async (paymentId: string | null, paymentMethod: string) => {
    if (!bookingData || !user) {
      throw new Error("Missing booking information");
    }

    const formData = watch();
    const startTime = new Date(formData.startTime);
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    const bookingResponse = await fetch("/api/driver/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: user.id,
        slotId: bookingData.slotId,
        parkingAreaId: bookingData.parkingAreaId,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        paymentMethod: paymentMethod,
        paymentId: paymentId,
      }),
    });

    const bookingResult = await bookingResponse.json();

    if (!bookingResponse.ok) {
      throw new Error(bookingResult.error || "Failed to create booking");
    }

    return bookingResult;
  };

  const handleRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment system is loading, please wait...");
      return;
    }

    try {
      // Create Razorpay order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `booking_${Date.now()}`,
          notes: {
            parkingArea: bookingData.parkingAreaName,
            slot: bookingData.slotNumber,
          },
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Smart Parking",
        description: `Parking at ${bookingData.parkingAreaName}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.verified) {
              throw new Error("Payment verification failed");
            }

            // Create booking after successful payment
            const bookingResult = await createBooking(response.razorpay_payment_id, "razorpay");

            // Clear booking data
            localStorage.removeItem("bookingData");
            toast.success("Payment successful! Booking confirmed.");
            
            // Redirect to receipt page
            router.push(`/driver/receipt/${bookingResult.booking.id}`);
          } catch (error: any) {
            toast.error(error.message || "Payment verification failed");
            setIsLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!bookingData || !user) {
      toast.error("Missing booking information");
      return;
    }

    // Validate vehicle type is selected
    if (!data.vehicleType) {
      toast.error("Please select a vehicle type");
      return;
    }

    setIsLoading(true);

    try {
      if (data.paymentMethod === "razorpay") {
        // Handle Razorpay payment
        await handleRazorpayPayment();
      } else {
        // Handle cash payment
        const bookingResult = await createBooking(null, "cash");
        
        // Clear booking data
        localStorage.removeItem("bookingData");
        toast.success("Booking confirmed! Pay cash when you arrive.");
        
        // Redirect to receipt page
        router.push(`/driver/receipt/${bookingResult.booking.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Booking failed");
      setIsLoading(false);
    }
  };

  if (authLoading || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading booking form...</p>
        </div>
      </div>
    );
  }

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href={`/driver/parking/${parkingId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Slot Selection
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Booking</CardTitle>
                <CardDescription>Fill in the details to reserve your parking slot</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Vehicle Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vehicle Details</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Select onValueChange={(value) => setValue("vehicleType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.vehicleType && <p className="text-sm text-red-500">Vehicle type is required</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                      <Input
                        id="vehicleNumber"
                        {...register("vehicleNumber", { required: "Vehicle number is required" })}
                        placeholder="DL01AB1234"
                        className="uppercase"
                      />
                      {errors.vehicleNumber && <p className="text-sm text-red-500">{errors.vehicleNumber.message}</p>}
                    </div>
                  </div>

                  {/* Parking Duration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Parking Duration</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        {...register("startTime", { required: "Start time is required" })}
                        min={minDateTime}
                      />
                      {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration *</Label>
                      <Select onValueChange={handleDurationChange} defaultValue="1">
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Hour</SelectItem>
                          <SelectItem value="2">2 Hours</SelectItem>
                          <SelectItem value="3">3 Hours</SelectItem>
                          <SelectItem value="4">4 Hours</SelectItem>
                          <SelectItem value="6">6 Hours</SelectItem>
                          <SelectItem value="8">8 Hours</SelectItem>
                          <SelectItem value="12">12 Hours</SelectItem>
                          <SelectItem value="24">1 Day (24 Hours)</SelectItem>
                          <SelectItem value="48">2 Days (48 Hours)</SelectItem>
                          <SelectItem value="72">3 Days (72 Hours)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Method</h3>
                    
                    <RadioGroup
                      defaultValue="cash"
                      onValueChange={(value) => setValue("paymentMethod", value)}
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="razorpay" id="razorpay" />
                        <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            <div>
                              <p className="font-medium">Pay Online with Razorpay</p>
                              <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-5 w-5" />
                            <div>
                              <p className="font-medium">Pay Cash on Arrival</p>
                              <p className="text-sm text-muted-foreground">Pay when you reach the parking</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Processing..." : paymentMethod === "razorpay" ? "Proceed to Pay" : "Confirm Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{bookingData.parkingAreaName}</h4>
                  <p className="text-sm text-muted-foreground">{bookingData.parkingAreaAddress}</p>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="font-medium">{bookingData.floorNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Slot:</span>
                    <span className="font-medium">#{bookingData.slotNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{duration} {duration === 1 ? "Hour" : "Hours"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
                  </div>
                  {duration >= 24 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily rate applied ({Math.ceil(duration / 24)} day{Math.ceil(duration / 24) > 1 ? "s" : ""})
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2 text-sm">Payment Details</h4>
                  {bookingData.upiId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">UPI ID: </span>
                      <span className="font-medium">{bookingData.upiId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}