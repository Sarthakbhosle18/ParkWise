import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, parkingAreas, slots, floors } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    // Validate driverId is required
    if (!driverId) {
      return NextResponse.json(
        { 
          error: 'Driver ID is required',
          code: 'MISSING_DRIVER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate driverId is a valid integer
    const driverIdInt = parseInt(driverId);
    if (isNaN(driverIdInt)) {
      return NextResponse.json(
        { 
          error: 'Driver ID must be a valid integer',
          code: 'INVALID_DRIVER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          error: 'Invalid booking status',
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = status
      ? and(
          eq(bookings.driverId, driverIdInt),
          eq(bookings.bookingStatus, status)
        )
      : eq(bookings.driverId, driverIdInt);

    // Fetch bookings with joined data
    const results = await db
      .select({
        id: bookings.id,
        driverId: bookings.driverId,
        slotId: bookings.slotId,
        vehicleType: bookings.vehicleType,
        vehicleNumber: bookings.vehicleNumber,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        durationHours: bookings.durationHours,
        totalAmount: bookings.totalAmount,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        paymentId: bookings.paymentId,
        bookingStatus: bookings.bookingStatus,
        createdAt: bookings.createdAt,
        parkingAreaId: parkingAreas.id,
        parkingAreaName: parkingAreas.name,
        parkingAreaAddress: parkingAreas.address,
        slotNumber: slots.slotNumber,
        floorNumber: floors.floorNumber,
      })
      .from(bookings)
      .leftJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(floors, eq(slots.floorId, floors.id))
      .leftJoin(parkingAreas, eq(bookings.parkingAreaId, parkingAreas.id))
      .where(conditions)
      .orderBy(desc(bookings.createdAt));

    // Transform results to match expected response structure
    const formattedResults = results.map((result) => ({
      id: result.id,
      driverId: result.driverId,
      slotId: result.slotId,
      vehicleType: result.vehicleType,
      vehicleNumber: result.vehicleNumber,
      startTime: result.startTime,
      endTime: result.endTime,
      durationHours: result.durationHours,
      totalAmount: result.totalAmount,
      paymentMethod: result.paymentMethod,
      paymentStatus: result.paymentStatus,
      paymentId: result.paymentId,
      bookingStatus: result.bookingStatus,
      createdAt: result.createdAt,
      parkingArea: {
        id: result.parkingAreaId,
        name: result.parkingAreaName,
        address: result.parkingAreaAddress,
      },
      slot: {
        id: result.slotId,
        slotNumber: result.slotNumber,
        floorNumber: result.floorNumber,
      },
    }));

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'SERVER_ERROR' 
      },
      { status: 500 }
    );
  }
}