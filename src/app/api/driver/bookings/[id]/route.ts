import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, slots } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = parseInt(params.id);

        if (isNaN(bookingId)) {
            return NextResponse.json(
                { error: "Invalid booking ID", code: "INVALID_BOOKING_ID" },
                { status: 400 }
            );
        }

        // Attempt to verify the driver ID via query param
        // In a real production app, verify this securely via the session token instead.
        const url = new URL(request.url);
        const driverIdParam = url.searchParams.get("driverId");

        // Find the current booking
        const bookingRecords = await db
            .select()
            .from(bookings)
            .where(eq(bookings.id, bookingId))
            .limit(1);

        if (bookingRecords.length === 0) {
            return NextResponse.json(
                { error: "Booking not found", code: "NOT_FOUND" },
                { status: 404 }
            );
        }

        const booking = bookingRecords[0];

        // Check ownership if driverId is provided
        if (driverIdParam && parseInt(driverIdParam) !== booking.driverId) {
            return NextResponse.json(
                { error: "Unauthorized access to booking", code: "UNAUTHORIZED" },
                { status: 403 }
            );
        }


        if (booking.bookingStatus !== "active") {
            return NextResponse.json(
                { error: `Cannot cancel a booking that is ${booking.bookingStatus}`, code: "INVALID_STATE" },
                { status: 400 }
            );
        }

        // Proceed with cancellation
        // 1. Update booking status
        await db
            .update(bookings)
            .set({ bookingStatus: "cancelled" })
            .where(eq(bookings.id, bookingId));

        // 2. Free up the slot
        await db
            .update(slots)
            .set({ status: "available" })
            .where(eq(slots.id, booking.slotId));

        return NextResponse.json(
            { message: "Booking cancelled successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE booking error:", error);
        return NextResponse.json(
            {
                error: "Internal server error: " + (error as Error).message,
                code: "SERVER_ERROR",
            },
            { status: 500 }
        );
    }
}
