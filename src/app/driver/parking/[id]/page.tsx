"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Slot {
  id: number;
  slotNumber: number;
  status: string;
}

interface Floor {
  id: number;
  floorNumber: number;
  totalSlots: number;
  slots: Slot[];
}

interface ParkingArea {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  dailyRate: number;
  totalFloors: number;
  upiId: string;
  floors: Floor[];
}

export default function ParkingDetail() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const parkingId = params.id as string;

  const [parkingArea, setParkingArea] = useState<ParkingArea | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "driver")) {
      router.push("/auth/driver/login");
      return;
    }

    if (user && parkingId) {
      fetchParkingDetails();
    }
  }, [user, authLoading, parkingId, router]);

  const fetchParkingDetails = async () => {
    try {
      const response = await fetch(`/api/driver/parking-area/${parkingId}`);
      if (response.ok) {
        const data = await response.json();
        setParkingArea(data);
      } else {
        toast.error("Failed to load parking details");
      }
    } catch (error) {
      console.error("Error fetching parking details:", error);
      toast.error("Failed to load parking details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSelect = (slot: Slot, floor: Floor) => {
    if (slot.status !== "available") {
      toast.error("This slot is not available");
      return;
    }
    setSelectedSlot(slot);
    setSelectedFloor(floor);
  };

  const handleBooking = () => {
    if (!selectedSlot || !selectedFloor || !parkingArea) {
      toast.error("Please select a slot");
      return;
    }

    // Navigate to booking page with slot details
    const bookingData = {
      parkingAreaId: parkingArea.id,
      parkingAreaName: parkingArea.name,
      parkingAreaAddress: parkingArea.address,
      slotId: selectedSlot.id,
      slotNumber: selectedSlot.slotNumber,
      floorNumber: selectedFloor.floorNumber,
      hourlyRate: parkingArea.hourlyRate,
      dailyRate: parkingArea.dailyRate,
      upiId: parkingArea.upiId,
    };

    localStorage.setItem("bookingData", JSON.stringify(bookingData));
    router.push(`/driver/booking/${parkingArea.id}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading parking details...</p>
        </div>
      </div>
    );
  }

  if (!parkingArea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Parking Area Not Found</h2>
          <Link href="/driver/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getSlotColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "occupied":
        return "bg-red-500 cursor-not-allowed";
      case "booked":
        return "bg-yellow-500 cursor-not-allowed";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/driver/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Parking Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle>{parkingArea.name}</CardTitle>
                    <CardDescription>
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {parkingArea.address}
                    </CardDescription>
                  </div>
                  {parkingArea.latitude && parkingArea.longitude && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${parkingArea.latitude},${parkingArea.longitude}`, "_blank")}
                    >
                      <MapPin className="mr-2 h-4 w-4 shrink-0" /> Navigate
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <span className="font-semibold">₹{parkingArea.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Rate:</span>
                      <span className="font-semibold">₹{parkingArea.dailyRate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Selected Slot</h4>
                  {selectedSlot && selectedFloor ? (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="font-medium">Floor {selectedFloor.floorNumber}</p>
                      <p className="text-sm text-muted-foreground">Slot #{selectedSlot.slotNumber}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No slot selected</p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Legend</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span>Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Occupied</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleBooking}
                  disabled={!selectedSlot}
                >
                  Proceed to Booking
                </Button>


              </CardContent>
            </Card>
          </div>

          {/* Floors and Slots */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select a Parking Slot</CardTitle>
                <CardDescription>Choose an available slot from any floor</CardDescription>
              </CardHeader>
              <CardContent>
                {parkingArea.floors.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No floors available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {parkingArea.floors.map((floor) => {
                      const availableCount = floor.slots.filter(s => s.status === "available").length;

                      return (
                        <div key={floor.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Floor {floor.floorNumber}</h3>
                            <Badge variant={availableCount > 0 ? "default" : "destructive"}>
                              {availableCount}/{floor.totalSlots} Available
                            </Badge>
                          </div>

                          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {floor.slots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => handleSlotSelect(slot, floor)}
                                disabled={slot.status !== "available"}
                                className={`
                                  aspect-square rounded-lg text-white font-semibold text-sm
                                  transition-all duration-200
                                  ${getSlotColor(slot.status)}
                                  ${selectedSlot?.id === slot.id ? "ring-4 ring-primary scale-110" : ""}
                                  ${slot.status === "available" ? "hover:scale-105" : ""}
                                `}
                              >
                                {slot.slotNumber}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
