import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, parkingAreas, ownerProfiles } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const areaId = searchParams.get("areaId");

        if (!userId) {
            return NextResponse.json(
                { message: "Owner ID is required" },
                { status: 400 }
            );
        }

        // First get the owner profile ID from the user ID
        const ownerProfile = await db.query.ownerProfiles.findFirst({
            where: eq(ownerProfiles.userId, parseInt(userId)),
        });

        if (!ownerProfile) {
            return NextResponse.json(
                { message: "Owner profile not found" },
                { status: 404 }
            );
        }

        // Get all parking areas owned by this owner depending if areaId is passed
        let areaIds: number[] = [];

        if (areaId) {
            // Validate this area actually belongs to the owner
            const specificArea = await db.query.parkingAreas.findFirst({
                where: (areas, { eq, and }) => and(eq(areas.id, parseInt(areaId)), eq(areas.ownerId, ownerProfile.id))
            });

            if (!specificArea) {
                return NextResponse.json({ message: "Parking Area not found or unauthorized." }, { status: 403 });
            }

            areaIds = [specificArea.id];
        } else {
            const areas = await db.query.parkingAreas.findMany({
                where: eq(parkingAreas.ownerId, ownerProfile.id),
                columns: { id: true },
            });

            if (areas.length === 0) {
                return NextResponse.json({
                    totalRevenue: 0,
                    totalBookings: 0,
                    activeBookings: 0,
                    revenueData: [],
                });
            }

            areaIds = areas.map((a) => a.id);
        }

        // Fetch all bookings for these parking areas
        const allBookings = await db.query.bookings.findMany({
            where: inArray(bookings.parkingAreaId, areaIds),
            orderBy: [desc(bookings.createdAt)],
        });

        // Calculate aggregated metrics
        let totalRevenue = 0;
        let totalBookings = allBookings.length;
        let activeBookings = 0;

        // To calculate daily revenue chart data
        const revenueByDate: Record<string, number> = {};

        allBookings.forEach((booking) => {
            // Add to revenue (assuming pending or completed; let's include completed for safety or just all for simplicity if we assume payment works)
            if (booking.paymentStatus === 'completed' || booking.paymentMethod === 'cash') {
                totalRevenue += booking.totalAmount;
            }

            // Calculate active bookings
            if (booking.bookingStatus === 'active') {
                activeBookings++;
            }

            // Calculate revenue by date
            const dateStr = new Date(booking.createdAt).toISOString().split('T')[0];
            if (!revenueByDate[dateStr]) {
                revenueByDate[dateStr] = 0;
            }
            if (booking.paymentStatus === 'completed' || booking.paymentMethod === 'cash') {
                revenueByDate[dateStr] += booking.totalAmount;
            }
        });

        // Convert revenueByDate into an array sorted by date suitable for recharts
        const revenueData = Object.entries(revenueByDate)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Last 30 days max for the chart

        return NextResponse.json({
            totalRevenue,
            totalBookings,
            activeBookings,
            revenueData,
        });
    } catch (error) {
        console.error("Error fetching insights:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
