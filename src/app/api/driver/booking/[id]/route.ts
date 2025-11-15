import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, parkingAreas, slots, floors, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Fetch booking with related data
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Fetch slot details
    const [slot] = await db
      .select()
      .from(slots)
      .where(eq(slots.id, booking.slotId))
      .limit(1);

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    // Fetch floor details
    const [floor] = await db
      .select()
      .from(floors)
      .where(eq(floors.id, slot.floorId))
      .limit(1);

    if (!floor) {
      return NextResponse.json(
        { error: "Floor not found" },
        { status: 404 }
      );
    }

    // Fetch parking area details
    const [parkingArea] = await db
      .select()
      .from(parkingAreas)
      .where(eq(parkingAreas.id, booking.parkingAreaId))
      .limit(1);

    if (!parkingArea) {
      return NextResponse.json(
        { error: "Parking area not found" },
        { status: 404 }
      );
    }

    // Fetch driver details
    const [driver] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, booking.driverId))
      .limit(1);

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    // Return formatted receipt data
    return NextResponse.json({
      booking: {
        id: booking.id,
        vehicleType: booking.vehicleType,
        vehicleNumber: booking.vehicleNumber,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId,
        bookingStatus: booking.bookingStatus,
        createdAt: booking.createdAt,
      },
      parkingArea: {
        name: parkingArea.name,
        address: parkingArea.address,
      },
      slot: {
        slotNumber: slot.slotNumber,
        floorNumber: floor.floorNumber,
      },
      driver: {
        name: driver.name,
        email: driver.email,
      },
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}
