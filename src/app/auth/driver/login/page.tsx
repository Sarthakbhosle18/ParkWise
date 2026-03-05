"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, ArrowLeft, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.userType !== "driver") {
        toast.error("This account is not a driver account");
        return;
      }

      login(data.user);
      toast.success("Login successful!");
      router.push("/driver/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Visual Pane */}
      <div className="hidden lg:flex flex-1 relative bg-sidebar overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] -z-10" />

        <div className="max-w-lg text-left z-10 p-12">
          <div className="bg-primary/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border border-primary/30 shadow-[0_0_30px_rgba(0,255,148,0.2)]">
            <Car className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Your Parking <br />
            <span className="text-primary">Simplified.</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Join thousands of drivers finding the best parking spots instantly through our enterprise-grade network.
          </p>
        </div>
      </div>

      {/* Right Form Pane */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-8 left-8 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="w-full max-w-md relative z-10">
          <Card className="bg-card/60 backdrop-blur-xl border-white/5 shadow-2xl">
            <CardHeader className="space-y-2 pb-8">
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your driver account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder=" "
                    className="peer pt-6 pb-2 h-14 bg-input/40"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Label
                    htmlFor="email"
                    className="absolute left-3 top-4 text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary z-10"
                  >
                    Email Address
                  </Label>
                </div>

                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    className="peer pt-6 pb-2 h-14 bg-input/40 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Label
                    htmlFor="password"
                    className="absolute left-3 top-4 text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary z-10"
                  >
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Link href="/auth/driver/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" size="lg" className="w-full h-12 text-md font-semibold" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/driver/signup" className="text-primary font-medium hover:underline">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}