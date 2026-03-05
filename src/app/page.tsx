"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Building2, MapPin, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-24 relative z-10 max-w-7xl">
        {/* HERO SECTION */}
        <motion.div
          className="text-center mb-24 mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="flex justify-center mb-8">
            <motion.div
              className="bg-primary/10 p-5 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-[0_0_30px_rgba(0,255,148,0.15)]"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Car className="h-16 w-16 text-primary drop-shadow-[0_0_10px_rgba(0,255,148,0.8)]" />
            </motion.div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-foreground drop-shadow-sm">
            Smart Parking Management
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed mb-10">
            Find and book premium parking spots instantly, or manage your parking facilities with our enterprise-grade platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth/driver/login">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full font-semibold">
                Get Started as Driver
              </Button>
            </Link>
            <Link href="/auth/owner/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full font-semibold bg-background/50 backdrop-blur-sm">
                Partner with Us
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* FEATURES SECTION */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8 mb-32"
        >
          {[
            { icon: MapPin, title: "Real-time Availability", desc: "View dynamic interactive maps to locate open slots instantly before you arrive." },
            { icon: Clock, title: "Instant Booking", desc: "Reserve your spot in under 30 seconds with seamlessly integrated one-tap payments." },
            { icon: ShieldCheck, title: "Enterprise Management", desc: "Facility owners get full visibility and control over pricing, allocation, and revenue tracking." }
          ].map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="h-full bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,255,148,0.08)] group">
                <CardHeader>
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground/80 mt-2">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ROLE SELECTION SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto relative relative z-10"
        >
          {/* Subtle pulse background behind cards */}
          <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-[80px] -z-10 animate-pulse" />

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Path</h2>
            <p className="text-muted-foreground text-lg">Select how you want to interact with our platform.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-card to-background border-white/5 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,255,148,0.1)] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
              <CardHeader className="text-center pb-2 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-primary/10 p-5 rounded-full border border-primary/20 group-hover:shadow-[0_0_20px_rgba(0,255,148,0.2)] transition-all">
                    <Car className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">Driver</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Seamlessly find and book parking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 relative z-10">
                <ul className="space-y-4 text-left mx-auto max-w-sm">
                  {[
                    "Search nearby parking areas instantly",
                    "Real-time slot availability updates",
                    "Multiple flexible payment options",
                    "Booking history & invoice management"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-muted-foreground group-hover:text-foreground/90 transition-colors">
                      <div className="mr-3 bg-primary/20 rounded-full p-1 text-primary"><ShieldCheck className="w-4 h-4" /></div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 space-y-3">
                  <Link href="/auth/driver/login" className="block">
                    <Button className="w-full text-md h-12 rounded-lg hover:shadow-[0_0_15px_rgba(0,255,148,0.3)]">Login as Driver</Button>
                  </Link>
                  <Link href="/auth/driver/signup" className="block">
                    <Button variant="outline" className="w-full text-md h-12 rounded-lg border-white/10 hover:bg-white/5">Create Account</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-background border-white/5 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,255,148,0.1)] group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
              <CardHeader className="text-center pb-2 relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-primary/10 p-5 rounded-full border border-primary/20 group-hover:shadow-[0_0_20px_rgba(0,255,148,0.2)] transition-all">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">Facility Owner</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Manage operations and track revenue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 relative z-10">
                <ul className="space-y-4 text-left mx-auto max-w-sm">
                  {[
                    "Register and map parking facilities",
                    "Dynamic pricing and spot management",
                    "Real-time analytics and revenue tracking",
                    "Automated UPI and settlement handling"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-muted-foreground group-hover:text-foreground/90 transition-colors">
                      <div className="mr-3 bg-primary/20 rounded-full p-1 text-primary"><ShieldCheck className="w-4 h-4" /></div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 space-y-3">
                  <Link href="/auth/owner/login" className="block">
                    <Button className="w-full text-md h-12 rounded-lg hover:shadow-[0_0_15px_rgba(0,255,148,0.3)]">Login as Owner</Button>
                  </Link>
                  <Link href="/auth/owner/signup" className="block">
                    <Button variant="outline" className="w-full text-md h-12 rounded-lg border-white/10 hover:bg-white/5">Partner With Us</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

      </div>
    </div>
  );
}