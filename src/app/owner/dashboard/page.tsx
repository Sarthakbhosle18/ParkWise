"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, LogOut, Plus, MapPin, IndianRupee, NotebookTabs, Activity, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ParkingArea {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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

  // Edit Location state
  const [editingArea, setEditingArea] = useState<ParkingArea | null>(null);
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Insights Modal state
  const [insightsArea, setInsightsArea] = useState<ParkingArea | null>(null);
  const [insights, setInsights] = useState<{
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    revenueData: any[];
  } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

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

  const handleUpdateLocation = async () => {
    if (!editingArea) return;

    setIsUpdating(true);
    try {
      const payload = {
        latitude: parseFloat(editLat),
        longitude: parseFloat(editLng)
      };

      const res = await fetch(`/api/owner/parking-area/${editingArea.id}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update location");
      }

      toast.success("Location updated successfully!");
      setEditingArea(null);
      fetchOwnerData(); // Refresh data
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update location");
    } finally {
      setIsUpdating(false);
    }
  };

  const loadSpecificInsights = async (area: ParkingArea) => {
    setInsightsArea(area);
    setIsLoadingInsights(true);
    setInsights(null); // Clear previous

    try {
      const insightsRes = await fetch(`/api/owner/insights?userId=${user?.id}&areaId=${area.id}`);
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      } else {
        toast.error("Failed to load specific insights for this area.");
      }
    } catch (err) {
      console.error("Error fetching specific insights:", err);
      toast.error("Internal server error fetching insights.");
    } finally {
      setIsLoadingInsights(false);
    }
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 border border-primary/30 p-3 rounded-xl shadow-[0_0_20px_rgba(0,255,148,0.2)]">
              <Building2 className="h-8 w-8 text-primary" />
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
                  const occupiedSlots = area.floors.reduce((sum, floor) => sum + floor.occupiedSlots + (floor.bookedSlots || 0), 0);

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
                        <div className="pt-3 border-t mt-3 flex justify-end gap-2 items-center">
                          <Dialog open={insightsArea?.id === area.id} onOpenChange={(open) => {
                            if (!open) {
                              setInsightsArea(null);
                            } else {
                              loadSpecificInsights(area);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="sm" className="shrink-0 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                                <BarChart3 className="mr-2 h-3 w-3" /> Insights
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Insights: {area.name}</DialogTitle>
                                <DialogDescription>
                                  Analytics and revenue breakdown specifically for this parking space.
                                </DialogDescription>
                              </DialogHeader>

                              {isLoadingInsights ? (
                                <div className="py-12 flex justify-center w-full">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </div>
                              ) : (
                                <div className="space-y-6 mt-4">
                                  <div className="grid md:grid-cols-3 gap-4">
                                    <Card className="bg-blue-500/5 border-blue-500/20">
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Site Revenue</CardTitle>
                                        <IndianRupee className="h-4 w-4 text-blue-500" />
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">₹{insights?.totalRevenue || 0}</div>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-green-500/5 border-green-500/20">
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                                        <NotebookTabs className="h-4 w-4 text-green-500" />
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">{insights?.totalBookings || 0}</div>
                                      </CardContent>
                                    </Card>

                                    <Card className="bg-purple-500/5 border-purple-500/20">
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                                        <Activity className="h-4 w-4 text-purple-500" />
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">{insights?.activeBookings || 0}</div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Revenue Trend</CardTitle>
                                      <CardDescription>Daily revenue localized to {area.name}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                      {!insights?.revenueData || insights.revenueData.length === 0 ? (
                                        <div className="flex h-full items-center justify-center text-muted-foreground">
                                          No revenue data available yet.
                                        </div>
                                      ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={insights.revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                            <XAxis
                                              dataKey="date"
                                              stroke="hsl(var(--muted-foreground))"
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                            />
                                            <YAxis
                                              stroke="hsl(var(--muted-foreground))"
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                              tickFormatter={(value) => `₹${value}`}
                                            />
                                            <Tooltip
                                              contentStyle={{
                                                backgroundColor: 'hsl(var(--popover))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                              }}
                                              formatter={(value) => [`₹${value}`, 'Revenue']}
                                            />
                                            <Line
                                              type="monotone"
                                              dataKey="revenue"
                                              stroke="hsl(var(--primary))"
                                              strokeWidth={3}
                                              dot={{ r: 4, strokeWidth: 2 }}
                                              activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Dialog open={editingArea?.id === area.id} onOpenChange={(open) => {
                            if (open) {
                              setEditingArea(area);
                              setEditLat(area.latitude?.toString() || "");
                              setEditLng(area.longitude?.toString() || "");
                            } else {
                              setEditingArea(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="shrink-0">
                                <MapPin className="mr-2 h-3 w-3" /> Edit Location
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Parking Location</DialogTitle>
                                <DialogDescription>
                                  Update exact GPS coordinates for {area.name} to help drivers navigate.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="latitude">Latitude</Label>
                                  <Input
                                    id="latitude"
                                    type="number"
                                    step="any"
                                    value={editLat}
                                    onChange={(e) => setEditLat(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="longitude">Longitude</Label>
                                  <Input
                                    id="longitude"
                                    type="number"
                                    step="any"
                                    value={editLng}
                                    onChange={(e) => setEditLng(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={handleUpdateLocation}
                                disabled={isUpdating || !editLat || !editLng}
                                className="w-full"
                              >
                                {isUpdating ? "Updating..." : "Save Location"}
                              </Button>
                            </DialogContent>
                          </Dialog>
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

