"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ParkingArea {
  id: number;
  name: string;
  address: string;
  totalFloors: number;
  hourlyRate: number;
  dailyRate: number;
  floors: Array<{
    floorNumber: number;
    totalSlots: number;
    availableSlots: number;
    occupiedSlots: number;
    bookedSlots: number;
  }>;
}

export default function OwnerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "owner")) {
      router.push("/auth/owner/login");
      return;
    }

    if (user) {
      fetchOwnerData();
    }
  }, [user, authLoading, router]);

  const fetchOwnerData = async () => {
    try {
      // Fetch owner profile
      const profileRes = await fetch(`/api/owner/profile?userId=${user?.id}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setOwnerProfile(profileData);

        // Fetch parking areas
        const areasRes = await fetch(`/api/owner/parking-areas?ownerId=${profileData.id}`);
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          setParkingAreas(areasData);
        }
      }
    } catch (error) {
      console.error("Error fetching owner data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Owner Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="areas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="areas">My Parking Areas</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="areas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Parking Areas</h2>
              <Link href="/owner/add-parking">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Parking Area
                </Button>
              </Link>
            </div>

            {parkingAreas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Parking Areas Yet</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first parking area</p>
                  <Link href="/owner/add-parking">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Parking Area
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parkingAreas.map((area) => {
                  const totalSlots = area.floors.reduce((sum, floor) => sum + floor.totalSlots, 0);
                  const availableSlots = area.floors.reduce((sum, floor) => sum + floor.availableSlots, 0);
                  const occupiedSlots = area.floors.reduce((sum, floor) => sum + floor.occupiedSlots, 0);

                  return (
                    <Card key={area.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>{area.name}</CardTitle>
                        <CardDescription>{area.address}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Floors</p>
                            <p className="font-semibold">{area.totalFloors}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Slots</p>
                            <p className="font-semibold">{totalSlots}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Available</p>
                            <p className="font-semibold text-green-600">{availableSlots}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Occupied</p>
                            <p className="font-semibold text-red-600">{occupiedSlots}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground">Pricing</p>
                          <p className="font-semibold">₹{area.hourlyRate}/hr • ₹{area.dailyRate}/day</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your owner account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                {ownerProfile?.phone && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <p className="font-medium">{ownerProfile.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Account Type</Label>
                  <p className="font-medium capitalize">{user?.userType}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
