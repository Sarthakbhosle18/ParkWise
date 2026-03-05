"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ImportedParking {
  id: number;
  name: string;
  address: string;
  city: string;
  floors: number;
  totalSlots: number;
}

const CITIES = [
  { key: "kolhapur", name: "Kolhapur", icon: "🏛️", locations: 5 },
  { key: "mumbai", name: "Mumbai", icon: "🏙️", locations: 8 },
  { key: "pune", name: "Pune", icon: "🎓", locations: 7 },
  { key: "delhi", name: "Delhi", icon: "🏛️", locations: 8 },
  { key: "sangli", name: "Sangli", icon: "🌾", locations: 5 },
];

export default function ImportParkingPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importingCity, setImportingCity] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<{
    success: boolean;
    message: string;
    imported: ImportedParking[];
    cities: string[];
  } | null>(null);

  const handleImport = async (city: string) => {
    setIsImporting(true);
    setImportingCity(city);
    setImportedData(null);

    try {
      const response = await fetch("/api/admin/import-kolhapur-parking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setImportedData(data);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to import parking data");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import parking data");
    } finally {
      setIsImporting(false);
      setImportingCity(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="mb-4">← Back to Home</Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="bg-primary/20 border border-primary/30 p-3 rounded-xl shadow-[0_0_20px_rgba(0,255,148,0.2)]"
            >
              <MapPin className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">Import Parking Data</h1>
              <p className="text-muted-foreground">Add parking locations from multiple cities</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select City to Import</CardTitle>
              <CardDescription>
                Choose individual cities or import all parking data at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import All Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => handleImport("all")}
                  disabled={isImporting}
                  size="lg"
                  className="w-full h-auto py-6 text-lg"
                  variant="default"
                >
                  {isImporting && importingCity === "all" ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Importing All Cities...
                    </>
                  ) : (
                    <>
                      <Download className="mr-3 h-6 w-6" />
                      Import All Cities (33 Locations)
                    </>
                  )}
                </Button>
              </motion.div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or select individual cities
                  </span>
                </div>
              </div>

              {/* Individual City Buttons */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {CITIES.map((city, index) => (
                    <motion.div
                      key={city.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="pt-6">
                          <div className="text-center space-y-3">
                            <div className="text-4xl">{city.icon}</div>
                            <div>
                              <h3 className="font-semibold text-lg">{city.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {city.locations} locations
                              </p>
                            </div>
                            <Button
                              onClick={() => handleImport(city.key)}
                              disabled={isImporting}
                              variant="outline"
                              className="w-full"
                            >
                              {isImporting && importingCity === city.key ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Import
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Note:</p>
                    <p className="text-yellow-800 dark:text-yellow-200">
                      This will skip parking areas that already exist in the database.
                      Each location includes automatically generated floors (1-3) and slots (20-50 per floor).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {importedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle>Import Complete!</CardTitle>
                  </div>
                  <CardDescription>
                    Imported {importedData.imported.length} new parking areas
                    {importedData.cities && importedData.cities.length > 0 && (
                      <> from {importedData.cities.join(", ")}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {importedData.imported.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <p className="text-muted-foreground">
                        All parking areas were already in the database.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      <AnimatePresence>
                        {importedData.imported.map((parking, index) => (
                          <motion.div
                            key={parking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-semibold">{parking.name}</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {parking.city}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{parking.address}</p>
                                  </div>
                                  <Badge variant="default">New</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                                  <div>
                                    <span className="text-muted-foreground">Floors:</span>
                                    <span className="ml-2 font-medium">{parking.floors}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Total Slots:</span>
                                    <span className="ml-2 font-medium">{parking.totalSlots}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Link href="/auth/driver/login" className="flex-1">
                      <Button variant="default" className="w-full">
                        <MapPin className="mr-2 h-4 w-4" />
                        View as Driver
                      </Button>
                    </Link>
                    <Link href="/auth/owner/login" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <MapPin className="mr-2 h-4 w-4" />
                        View as Owner
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>What Gets Imported?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Real parking locations with accurate GPS coordinates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Multiple floors (1-3 floors per location)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Parking slots (20-50 slots per floor)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Realistic availability (80% available, 10% booked, 10% occupied)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Reasonable hourly pricing (₹20-50/hour)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}