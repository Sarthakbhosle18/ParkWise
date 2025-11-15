"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Building2, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Car className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Parking Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find and book parking spots instantly, or manage your parking facilities with ease
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Availability</CardTitle>
              <CardDescription>
                See available parking spots on an interactive map
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Instant Booking</CardTitle>
              <CardDescription>
                Reserve your spot in seconds with flexible payment options
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Building2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Manage Facilities</CardTitle>
              <CardDescription>
                Owners can easily manage parking areas and track revenue
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Choose Your Role</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full">
                    <Car className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">I'm a Driver</CardTitle>
                <CardDescription className="text-center">
                  Find and book parking spots near you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Search nearby parking areas
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Real-time slot availability
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Multiple payment options
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Booking history & management
                  </li>
                </ul>
                <Link href="/auth/driver/login" className="block">
                  <Button className="w-full" size="lg">Login as Driver</Button>
                </Link>
                <Link href="/auth/driver/signup" className="block">
                  <Button variant="outline" className="w-full" size="lg">Sign Up</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-6 rounded-full">
                    <Building2 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">I'm an Owner</CardTitle>
                <CardDescription className="text-center">
                  Manage your parking facilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Register parking areas
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Manage floors & slots
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Set pricing & UPI details
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="mr-2">✓</span>
                    Track bookings & revenue
                  </li>
                </ul>
                <Link href="/auth/owner/login" className="block">
                  <Button className="w-full" size="lg" variant="default">Login as Owner</Button>
                </Link>
                <Link href="/auth/owner/signup" className="block">
                  <Button variant="outline" className="w-full" size="lg">Sign Up</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto mt-12 border-dashed">
          <CardHeader>
            <CardTitle className="text-center">Demo Credentials</CardTitle>
            <CardDescription className="text-center">Test the application with these accounts</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">Driver Account:</p>
              <p>Email: driver1@test.com</p>
              <p>Password: Password123!</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Owner Account:</p>
              <p>Email: owner1@parking.com</p>
              <p>Password: Password123!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}