import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parkingAreas, floors, slots } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    // Validate ownerId parameter
    if (!ownerId) {
      return NextResponse.json(
        { 
          error: "Owner ID is required",
          code: "MISSING_OWNER_ID" 
        },
        { status: 400 }
      );
    }

    const ownerIdInt = parseInt(ownerId);
    if (isNaN(ownerIdInt)) {
      return NextResponse.json(
        { 
          error: "Owner ID must be a valid integer",
          code: "INVALID_OWNER_ID" 
        },
        { status: 400 }
      );
    }

    // Fetch all parking areas for the owner
    const ownerParkingAreas = await db
      .select()
      .from(parkingAreas)
      .where(eq(parkingAreas.ownerId, ownerIdInt));

    // Build response with nested floors and slot statistics
    const response = await Promise.all(
      ownerParkingAreas.map(async (parkingArea) => {
        // Fetch all floors for this parking area
        const parkingFloors = await db
          .select()
          .from(floors)
          .where(eq(floors.parkingAreaId, parkingArea.id));

        // For each floor, calculate slot statistics
        const floorsWithStats = await Promise.all(
          parkingFloors.map(async (floor) => {
            // Fetch all slots for this floor
            const floorSlots = await db
              .select()
              .from(slots)
              .where(eq(slots.floorId, floor.id));

            // Count slots by status
            const availableSlots = floorSlots.filter(
              (slot) => slot.status === 'available'
            ).length;
            const occupiedSlots = floorSlots.filter(
              (slot) => slot.status === 'occupied'
            ).length;
            const bookedSlots = floorSlots.filter(
              (slot) => slot.status === 'booked'
            ).length;
            const totalSlots = floorSlots.length;

            return {
              id: floor.id,
              floorNumber: floor.floorNumber,
              totalSlots,
              availableSlots,
              occupiedSlots,
              bookedSlots,
            };
          })
        );

        return {
          id: parkingArea.id,
          name: parkingArea.name,
          address: parkingArea.address,
          latitude: parkingArea.latitude,
          longitude: parkingArea.longitude,
          totalFloors: parkingArea.totalFloors,
          hourlyRate: parkingArea.hourlyRate,
          dailyRate: parkingArea.dailyRate,
          upiId: parkingArea.upiId,
          photos: parkingArea.photos,
          createdAt: parkingArea.createdAt,
          floors: floorsWithStats,
        };
      })
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: "SERVER_ERROR" 
      },
      { status: 500 }
    );
  }
}