"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ParkingFormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalFloors: number;
  slotsPerFloor: number;
  hourlyRate: number;
  dailyRate: number;
  upiId: string;
}

export default function AddParkingArea() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ParkingFormData>();

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "owner")) {
      router.push("/auth/owner/login");
      return;
    }

    if (user) {
      fetchOwnerProfile();
    }
  }, [user, authLoading, router]);

  const fetchOwnerProfile = async () => {
    try {
      const res = await fetch(`/api/owner/profile?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setOwnerProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const onSubmit = async (data: ParkingFormData) => {
    if (!ownerProfile) {
      toast.error("Owner profile not found");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/owner/parking-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: ownerProfile.id,
          name: data.name,
          address: data.address,
          latitude: parseFloat(data.latitude.toString()),
          longitude: parseFloat(data.longitude.toString()),
          totalFloors: parseInt(data.totalFloors.toString()),
          slotsPerFloor: parseInt(data.slotsPerFloor.toString()),
          hourlyRate: parseFloat(data.hourlyRate.toString()),
          dailyRate: parseFloat(data.dailyRate.toString()),
          upiId: data.upiId,
          photos: [
            "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400",
            "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400"
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create parking area");
      }

      toast.success("Parking area created successfully!");
      router.push("/owner/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create parking area");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto max-w-2xl py-8 relative z-10">
        <Link href="/owner/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Add New Parking Area</CardTitle>
            <CardDescription>Fill in the details to register your parking facility</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Parking Area Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  placeholder="Downtown Parking Plaza"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  {...register("address", { required: "Address is required" })}
                  placeholder="123 Main Street, City"
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register("latitude", { required: "Latitude is required" })}
                    placeholder="28.6139"
                  />
                  {errors.latitude && <p className="text-sm text-red-500">{errors.latitude.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register("longitude", { required: "Longitude is required" })}
                    placeholder="77.2090"
                  />
                  {errors.longitude && <p className="text-sm text-red-500">{errors.longitude.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFloors">Number of Floors *</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    {...register("totalFloors", { required: "Number of floors is required", min: 1 })}
                    placeholder="3"
                  />
                  {errors.totalFloors && <p className="text-sm text-red-500">{errors.totalFloors.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slotsPerFloor">Slots per Floor *</Label>
                  <Input
                    id="slotsPerFloor"
                    type="number"
                    {...register("slotsPerFloor", { required: "Slots per floor is required", min: 1 })}
                    placeholder="20"
                  />
                  {errors.slotsPerFloor && <p className="text-sm text-red-500">{errors.slotsPerFloor.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="any"
                    {...register("hourlyRate", { required: "Hourly rate is required", min: 0 })}
                    placeholder="50"
                  />
                  {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyRate">Daily Rate (₹) *</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    step="any"
                    {...register("dailyRate", { required: "Daily rate is required", min: 0 })}
                    placeholder="500"
                  />
                  {errors.dailyRate && <p className="text-sm text-red-500">{errors.dailyRate.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID *</Label>
                <Input
                  id="upiId"
                  {...register("upiId", { required: "UPI ID is required" })}
                  placeholder="yourname@upi"
                />
                {errors.upiId && <p className="text-sm text-red-500">{errors.upiId.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Parking Area"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
