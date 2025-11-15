"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Receipt } from "@/components/Receipt";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ReceiptPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.userType !== "driver")) {
      router.push("/auth/driver/login");
      return;
    }

    if (user && bookingId) {
      fetchReceiptData();
    }
  }, [user, authLoading, bookingId, router]);

  const fetchReceiptData = async () => {
    try {
      const response = await fetch(`/api/driver/booking/${bookingId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch receipt data");
      }

      const data = await response.json();
      setReceiptData(data);
    } catch (error: any) {
      console.error("Error fetching receipt:", error);
      toast.error("Failed to load receipt");
      router.push("/driver/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Receipt not found</p>
          <Link href="/driver/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/driver/dashboard">
          <Button variant="ghost" className="mb-4 print:hidden">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <Receipt
          booking={receiptData.booking}
          parkingArea={receiptData.parkingArea}
          slot={receiptData.slot}
          driver={receiptData.driver}
        />
      </div>
    </div>
  );
}
