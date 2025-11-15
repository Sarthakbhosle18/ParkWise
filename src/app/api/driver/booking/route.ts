import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings, slots, parkingAreas } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      driverId,
      slotId,
      parkingAreaId,
      vehicleType,
      vehicleNumber,
      startTime,
      endTime,
      paymentMethod,
      paymentId
    } = body;

    // Validate required fields
    if (!driverId) {
      return NextResponse.json({
        error: 'Driver ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!slotId) {
      return NextResponse.json({
        error: 'Slot ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!parkingAreaId) {
      return NextResponse.json({
        error: 'Parking area ID is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!vehicleType) {
      return NextResponse.json({
        error: 'Vehicle type is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!vehicleNumber) {
      return NextResponse.json({
        error: 'Vehicle number is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!startTime) {
      return NextResponse.json({
        error: 'Start time is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!endTime) {
      return NextResponse.json({
        error: 'End time is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({
        error: 'Payment method is required',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Validate payment method
    if (paymentMethod !== 'razorpay' && paymentMethod !== 'cash') {
      return NextResponse.json({
        error: 'Payment method must be either "razorpay" or "cash"',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Validate paymentId for razorpay
    if (paymentMethod === 'razorpay' && !paymentId) {
      return NextResponse.json({
        error: 'Payment ID is required for razorpay payment method',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Validate time format and logic
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid start time format',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (isNaN(endDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid end time format',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({
        error: 'Start time must be before end time',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (startDate < now) {
      return NextResponse.json({
        error: 'Start time must be in the future',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Check if slot exists and is available
    const slot = await db.select()
      .from(slots)
      .where(eq(slots.id, parseInt(slotId)))
      .limit(1);

    if (slot.length === 0) {
      return NextResponse.json({
        error: 'Slot not found',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    if (slot[0].status !== 'available') {
      return NextResponse.json({
        error: 'Slot is not available',
        code: 'SLOT_UNAVAILABLE'
      }, { status: 409 });
    }

    // Calculate duration in hours
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Fetch parking area to get rates
    const parkingArea = await db.select()
      .from(parkingAreas)
      .where(eq(parkingAreas.id, parseInt(parkingAreaId)))
      .limit(1);

    if (parkingArea.length === 0) {
      return NextResponse.json({
        error: 'Parking area not found',
        code: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Calculate total amount
    let totalAmount;
    if (duration >= 24) {
      const days = Math.ceil(duration / 24);
      totalAmount = days * parkingArea[0].dailyRate;
    } else {
      totalAmount = Math.ceil(duration) * parkingArea[0].hourlyRate;
    }

    // Create booking
    const newBooking = await db.insert(bookings)
      .values({
        driverId: parseInt(driverId),
        slotId: parseInt(slotId),
        parkingAreaId: parseInt(parkingAreaId),
        vehicleType: vehicleType.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime,
        endTime,
        durationHours: duration,
        totalAmount,
        paymentMethod,
        paymentId: paymentId || null,
        paymentStatus: 'pending',
        bookingStatus: 'active',
        createdAt: new Date().toISOString()
      })
      .returning();

    // Update slot status to booked
    await db.update(slots)
      .set({
        status: 'booked'
      })
      .where(eq(slots.id, parseInt(slotId)));

    return NextResponse.json({
      success: true,
      booking: {
        id: newBooking[0].id,
        driverId: newBooking[0].driverId,
        slotId: newBooking[0].slotId,
        parkingAreaId: newBooking[0].parkingAreaId,
        vehicleType: newBooking[0].vehicleType,
        vehicleNumber: newBooking[0].vehicleNumber,
        startTime: newBooking[0].startTime,
        endTime: newBooking[0].endTime,
        durationHours: newBooking[0].durationHours,
        totalAmount: newBooking[0].totalAmount,
        paymentMethod: newBooking[0].paymentMethod,
        paymentStatus: newBooking[0].paymentStatus,
        bookingStatus: newBooking[0].bookingStatus,
        createdAt: newBooking[0].createdAt
      },
      message: 'Booking created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}