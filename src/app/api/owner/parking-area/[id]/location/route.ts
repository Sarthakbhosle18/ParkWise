import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parkingAreas } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const parkingAreaId = parseInt(id);

        if (isNaN(parkingAreaId)) {
            return NextResponse.json({ message: "Invalid parking area ID" }, { status: 400 });
        }

        const body = await request.json();
        const { latitude, longitude } = body;

        // Validation Rules
        if (latitude === undefined || latitude === null || typeof latitude !== 'number') {
            return NextResponse.json({ message: "Invalid latitude value" }, { status: 400 });
        }

        if (latitude < -90 || latitude > 90) {
            return NextResponse.json({ message: "Invalid latitude value" }, { status: 400 });
        }

        if (longitude === undefined || longitude === null || typeof longitude !== 'number') {
            return NextResponse.json({ message: "Invalid longitude value" }, { status: 400 });
        }

        if (longitude < -180 || longitude > 180) {
            return NextResponse.json({ message: "Invalid longitude value" }, { status: 400 });
        }

        // Update in Database
        const updatedParkingArea = await db.update(parkingAreas)
            .set({
                latitude,
                longitude
            })
            .where(eq(parkingAreas.id, parkingAreaId))
            .returning();

        if (!updatedParkingArea || updatedParkingArea.length === 0) {
            return NextResponse.json({ message: "Parking area not found or failed to update" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Parking location updated successfully",
            parkingArea: updatedParkingArea[0]
        }, { status: 200 });

    } catch (error) {
        console.error('PUT location update error:', error);
        return NextResponse.json({
            message: "Internal server error"
        }, { status: 500 });
    }
}
