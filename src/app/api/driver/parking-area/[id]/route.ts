import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parkingAreas, floors, slots } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid parking area ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const parkingAreaId = parseInt(id);

    // Fetch parking area
    const parkingAreaResult = await db
      .select()
      .from(parkingAreas)
      .where(eq(parkingAreas.id, parkingAreaId))
      .limit(1);

    if (parkingAreaResult.length === 0) {
      return NextResponse.json(
        { 
          error: 'Parking area not found',
          code: 'NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const parkingArea = parkingAreaResult[0];

    // Fetch all floors for this parking area
    const floorsResult = await db
      .select()
      .from(floors)
      .where(eq(floors.parkingAreaId, parkingAreaId));

    // Fetch slots for all floors
    const floorsWithSlots = await Promise.all(
      floorsResult.map(async (floor) => {
        const slotsResult = await db
          .select()
          .from(slots)
          .where(eq(slots.floorId, floor.id));

        return {
          id: floor.id,
          floorNumber: floor.floorNumber,
          totalSlots: floor.totalSlots,
          slots: slotsResult.map((slot) => ({
            id: slot.id,
            slotNumber: slot.slotNumber,
            status: slot.status,
            createdAt: slot.createdAt,
          })),
        };
      })
    );

    // Build complete response
    const response = {
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
      floors: floorsWithSlots,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET parking area details error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'SERVER_ERROR' 
      },
      { status: 500 }
    );
  }
}