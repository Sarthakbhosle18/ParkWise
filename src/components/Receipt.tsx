"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Download, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReceiptProps {
  booking: {
    id: number;
    vehicleType: string;
    vehicleNumber: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentId?: string;
    bookingStatus: string;
    createdAt: string;
  };
  parkingArea: {
    name: string;
    address: string;
  };
  slot: {
    slotNumber: number;
    floorNumber: number;
  };
  driver: {
    name: string;
    email: string;
  };
}

export const Receipt = ({ booking, parkingArea, slot, driver }: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      toast.info("Generating PDF...");

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`parking-receipt-${booking.id}.pdf`);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download receipt");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const calculateDuration = () => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    return hours;
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons - Hidden in Print */}
      <div className="flex gap-2 justify-end print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Receipt Card */}
      <div ref={receiptRef} className="bg-white print:shadow-none">
        <Card className="max-w-2xl mx-auto border-2 print:border-0">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 print:bg-none">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Payment Receipt</h2>
            <p className="text-muted-foreground">Smart Parking Management System</p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Payment Status */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 uppercase">
                {booking.paymentStatus}
              </p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt No.</p>
                  <p className="font-semibold text-foreground">#RCP{booking.id.toString().padStart(6, "0")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">{formatDate(booking.createdAt)}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-2 pb-4 border-b">
                <h3 className="font-semibold text-lg text-foreground">Customer Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium text-foreground">{driver.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium text-foreground">{driver.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle Type:</span>
                    <p className="font-medium capitalize text-foreground">{booking.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehicle Number:</span>
                    <p className="font-medium uppercase text-foreground">{booking.vehicleNumber}</p>
                  </div>
                </div>
              </div>

              {/* Parking Details */}
              <div className="space-y-2 pb-4 border-b">
                <h3 className="font-semibold text-lg text-foreground">Parking Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium text-foreground">{parkingArea.name}</p>
                    <p className="text-xs text-muted-foreground">{parkingArea.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Floor:</span>
                      <p className="font-medium text-foreground">Floor {slot.floorNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slot:</span>
                      <p className="font-medium text-foreground">Slot #{slot.slotNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Period */}
              <div className="space-y-2 pb-4 border-b">
                <h3 className="font-semibold text-lg text-foreground">Booking Period</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Time:</span>
                    <p className="font-medium text-foreground">{formatDate(booking.startTime)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Time:</span>
                    <p className="font-medium text-foreground">{formatDate(booking.endTime)}</p>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium text-foreground">{calculateDuration()} hours</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-2 pb-4 border-b">
                <h3 className="font-semibold text-lg text-foreground">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium capitalize text-foreground">{booking.paymentMethod}</span>
                  </div>
                  {booking.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-medium font-mono text-xs text-foreground">{booking.paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Status:</span>
                    <span className="font-medium capitalize text-foreground">{booking.bookingStatus}</span>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg print:bg-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total Amount Paid</span>
                  <span className="text-3xl font-bold text-primary">₹{booking.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Thank you for using Smart Parking Management System
              </p>
              <p className="text-xs text-muted-foreground">
                This is a computer-generated receipt and does not require a signature.
              </p>
              <p className="text-xs text-muted-foreground">
                For queries, please contact support@smartparking.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};