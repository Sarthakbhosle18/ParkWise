"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Car, LogOut, MapPin, Search, Filter, X, Loader2, Locate } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ParkingArea {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
  hourlyRate: number;
  dailyRate: number;
  availableSlots: number;
  totalSlots: number;
}

interface Booking {
  id: number;
  vehicleType: string;
  vehicleNumber: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  parkingArea: {
    name: string;
    address: string;
  };
  slot: {
    slotNumber: number;
    floorNumber: number;
  };
}

const CITY_PRESETS = {
  kolhapur: { lat: 16.7050, lng: 74.2433, name: "Kolhapur" },
  mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune" },
  delhi: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
  sangli: { lat: 16.8524, lng: 74.5815, name: "Sangli" },
};

const CITY_COLORS: Record<string, string> = {
  "Kolhapur": "bg-blue-500",
  "Mumbai": "bg-purple-500",
  "Pune": "bg-green-500",
  "Delhi": "bg-orange-500",
  "Sangli": "bg-pink-500",
  "Unknown": "bg-gray-500"
};

export default function DriverDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [nearbyParking, setNearbyParking] = useState<ParkingArea[]>([]);
  const [filteredParking, setFilteredParking] = useState<ParkingArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isCanceling, setIsCanceling] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentCity, setCurrentCity] = useState<string>("all");
  const [showAllCities, setShowAllCities] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "price" | "availability">("distance");
  const [maxDistance, setMaxDistance] = useState<number>(500);
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "driver")) {
      router.push("/auth/driver/login");
      return;
    }

    if (user) {
      const kolhapurLocation = CITY_PRESETS.kolhapur;
      setUserLocation(kolhapurLocation);
      fetchAllParking(kolhapurLocation.lat, kolhapurLocation.lng);
      fetchBookings();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [nearbyParking, searchQuery, sortBy, maxDistance, maxPrice, availabilityFilter, cityFilter, showAllCities]);

  const applyFiltersAndSort = () => {
    let filtered = [...nearbyParking];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (area) =>
          area.name.toLowerCase().includes(query) ||
          area.address.toLowerCase().includes(query) ||
          area.city.toLowerCase().includes(query)
      );
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((area) => area.city === cityFilter);
    }

    if (!showAllCities) {
      filtered = filtered.filter((area) => area.distance <= maxDistance);
    }

    filtered = filtered.filter((area) => area.hourlyRate <= maxPrice);

    if (availabilityFilter === "available") {
      filtered = filtered.filter((area) => area.availableSlots > 0);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance;
        case "price":
          return a.hourlyRate - b.hourlyRate;
        case "availability":
          return b.availableSlots - a.availableSlots;
        default:
          return 0;
      }
    });

    setFilteredParking(filtered);
  };
  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("distance");
    setMaxDistance(500);
    setMaxPrice(500);
    setAvailabilityFilter("all");
    setCityFilter("all");
  };
  const searchCity = (cityKey: keyof typeof CITY_PRESETS) => {
    const city = CITY_PRESETS[cityKey];
    setCurrentCity(cityKey);
    setCityFilter(city.name);
    setUserLocation(city);
    setShowAllCities(false);

    // Fetch parking data with new city coordinates
    fetchAllParking(city.lat, city.lng, false);
    toast.success(`Showing parking in ${city.name}`);
  };

  const showAllParkingAreas = () => {
    setCurrentCity("all");
    setCityFilter("all");
    setShowAllCities(true);
    const kolhapurLocation = CITY_PRESETS.kolhapur;
    setUserLocation(kolhapurLocation);

    toast.success("Showing all parking areas across all cities");
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your current location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setCurrentCity("current");
          setCityFilter("all");
          setShowAllCities(false);

          fetchAllParking(location.lat, location.lng, false);
          toast.success("Using your current location");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Showing all parking.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const fetchAllParking = async (lat: number, lng: number, isInitial: boolean = true) => {
    if (isInitial) {
      setIsLoadingData(true);
    }

    try {
      const response = await fetch(`/api/driver/nearby-parking?lat=${lat}&lng=${lng}&showAll=true`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNearbyParking(data);

      if (data.length === 0) {
        toast.info("No parking areas found.");
      } else if (!isInitial) {
        const cities = [...new Set(data.map((area: ParkingArea) => area.city))];
        toast.success(`Found ${data.length} parking area(s) across ${cities.length} cities`);
      }
    } catch (error) {
      console.error("Error fetching parking:", error);
      toast.error("Failed to load parking areas");
      setNearbyParking([]);
    } finally {
      if (isInitial) {
        setIsLoadingData(false);
        setIsInitialLoad(false);
      }
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/driver/bookings?driverId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        // Since we might have stale data locally when component remounts or re-fetches
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const cancelBooking = async (bookingId: number) => {
    if (!user) return;

    // Optional: confirm prompt
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setIsCanceling(bookingId);
    try {
      const response = await fetch(`/api/driver/bookings/${bookingId}?driverId=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel the booking');
      }

      toast.success('Booking cancelled successfully');

      // Opt 1: Refresh list
      fetchBookings();
      // Opt 2: Optimistic UI updates
      // setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bookingStatus: 'cancelled' } : b));

      // Also fetch nearby parking to ensure slot statuses there are updated 
      if (userLocation) {
        fetchAllParking(userLocation.lat, userLocation.lng, false);
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      toast.error('Failed to cancel booking. Please try again.');
    } finally {
      setIsCanceling(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const uniqueCities = [...new Set(nearbyParking.map(area => area.city))].sort();

  if (authLoading || isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p>Loading dashboard...</p>
        </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/20 border border-primary/30 p-3 rounded-xl shadow-[0_0_20px_rgba(0,255,148,0.2)]"
            >
              <Car className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">Driver Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </motion.div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList>
            <TabsTrigger value="map">Find Parking</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            {/* City Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Select Location</CardTitle>
                  <CardDescription>Choose a city, show all areas, or use your current location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={currentCity === "all" ? "default" : "outline"}
                        onClick={showAllParkingAreas}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        All Cities
                      </Button>
                    </motion.div>
                    {Object.entries(CITY_PRESETS).map(([key, city], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={currentCity === key ? "default" : "outline"}
                          onClick={() => searchCity(key as keyof typeof CITY_PRESETS)}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {city.name}
                        </Button>
                      </motion.div>
                    ))}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={currentCity === "current" ? "default" : "outline"}
                        onClick={useCurrentLocation}
                      >
                        <Locate className="mr-2 h-4 w-4" />
                        Use My Location
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Search and Filter Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Search Parking</CardTitle>
                  <CardDescription>Find the perfect parking spot for your needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, city, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                      </Button>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border rounded-lg p-4 space-y-4 bg-muted/20"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Filters</h4>
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Select value={cityFilter} onValueChange={setCityFilter}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {uniqueCities.map(city => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Sort By</Label>
                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="distance">Distance</SelectItem>
                                <SelectItem value="price">Price (Low to High)</SelectItem>
                                <SelectItem value="availability">Availability</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Availability</Label>
                            <Select value={availabilityFilter} onValueChange={(value: any) => setAvailabilityFilter(value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Parking</SelectItem>
                                <SelectItem value="available">Available Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Max Price: ₹{maxPrice}/hr</Label>
                            <Slider
                              value={[maxPrice]}
                              onValueChange={(value) => setMaxPrice(value[0])}
                              min={10}
                              max={500}
                              step={10}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold">{filteredParking.length}</span> of{" "}
                            <span className="font-semibold">{nearbyParking.length}</span> parking areas
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Available Parking</CardTitle>
                  <CardDescription>
                    <Car className="inline h-4 w-4 mr-1" />
                    Browse and book nearby parking slots
                  </CardDescription>
                </CardHeader>
                <CardContent>

                  {/* Parking List */}
                  {filteredParking.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Parking Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {nearbyParking.length === 0
                          ? "No parking areas available yet."
                          : "Try adjusting your search filters"}
                      </p>
                      {nearbyParking.length > 0 && (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {filteredParking.map((area, index) => (
                          <motion.div
                            key={area.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                          >
                            <Card className="hover:shadow-lg transition-shadow h-full">
                              <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                  <CardTitle className="text-lg">{area.name}</CardTitle>
                                  <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {area.availableSlots > 0 ? (
                                      <Badge variant="default" className="bg-green-500">Available</Badge>
                                    ) : (
                                      <Badge variant="destructive">Full</Badge>
                                    )}
                                  </motion.div>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`${CITY_COLORS[area.city] || CITY_COLORS["Unknown"]} text-white`}>
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {area.city}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {area.distance.toFixed(1)} km
                                  </Badge>
                                </div>
                                <CardDescription className="text-xs">{area.address}</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Available Slots</span>
                                  <span className="font-semibold text-green-600">
                                    {area.availableSlots}/{area.totalSlots}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Pricing</span>
                                  <span className="font-semibold">₹{area.hourlyRate}/hr</span>
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`https://www.google.com/maps/dir/?api=1&destination=${area.latitude},${area.longitude}`} target="_blank" className="flex-1">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                      <Button variant="outline" className="w-full">
                                        <MapPin className="h-3 w-3 mr-1" /> Nav
                                      </Button>
                                    </motion.div>
                                  </Link>
                                  <Link href={`/driver/parking/${area.id}`} className="flex-[2]">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                      <Button className="w-full" disabled={area.availableSlots === 0}>
                                        {area.availableSlots > 0 ? "Book" : "Full"}
                                      </Button>
                                    </motion.div>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="bookings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>View and manage your parking bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                      <p className="text-muted-foreground">Start by finding a parking spot</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {bookings.map((booking, index) => (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="font-semibold">{booking.parkingArea.name}</h4>
                                    <p className="text-sm text-muted-foreground">{booking.parkingArea.address}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge variant={booking.bookingStatus === "active" ? "default" : "secondary"}>
                                      {booking.bookingStatus}
                                    </Badge>
                                    {booking.bookingStatus === "active" && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => cancelBooking(booking.id)}
                                        disabled={isCanceling === booking.id}
                                      >
                                        {isCanceling === booking.id ? (
                                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Canceling</>
                                        ) : (
                                          "Cancel Booking"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Vehicle</p>
                                    <p className="font-medium">{booking.vehicleNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Slot</p>
                                    <p className="font-medium">Floor {booking.slot?.floorNumber}, Slot {booking.slot?.slotNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-medium">₹{booking.totalAmount}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Payment</p>
                                    <Badge variant={booking.paymentStatus === "completed" ? "default" : "outline"}>
                                      {booking.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}