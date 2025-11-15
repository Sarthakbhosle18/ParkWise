import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parkingAreas, floors, slots } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      ownerId, 
      name, 
      address, 
      latitude, 
      longitude, 
      totalFloors, 
      hourlyRate, 
      dailyRate, 
      upiId, 
      photos,
      slotsPerFloor 
    } = body;

    // Validate required fields
    if (!ownerId) {
      return NextResponse.json({ 
        error: "Owner ID is required",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json({ 
        error: "Address is required and must be a non-empty string",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (latitude === undefined || latitude === null || typeof latitude !== 'number') {
      return NextResponse.json({ 
        error: "Latitude is required and must be a number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json({ 
        error: "Latitude must be between -90 and 90",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (longitude === undefined || longitude === null || typeof longitude !== 'number') {
      return NextResponse.json({ 
        error: "Longitude is required and must be a number",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json({ 
        error: "Longitude must be between -180 and 180",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!totalFloors || typeof totalFloors !== 'number' || totalFloors < 1) {
      return NextResponse.json({ 
        error: "Total floors is required and must be >= 1",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!hourlyRate || typeof hourlyRate !== 'number' || hourlyRate <= 0) {
      return NextResponse.json({ 
        error: "Hourly rate is required and must be > 0",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!dailyRate || typeof dailyRate !== 'number' || dailyRate <= 0) {
      return NextResponse.json({ 
        error: "Daily rate is required and must be > 0",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    if (!slotsPerFloor || typeof slotsPerFloor !== 'number' || slotsPerFloor < 1) {
      return NextResponse.json({ 
        error: "Slots per floor is required and must be >= 1",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    // Validate optional fields
    if (photos !== undefined && !Array.isArray(photos)) {
      return NextResponse.json({ 
        error: "Photos must be an array",
        code: "VALIDATION_ERROR" 
      }, { status: 400 });
    }

    const createdAt = new Date().toISOString();

    // Create parking area
    const newParkingArea = await db.insert(parkingAreas)
      .values({
        ownerId: parseInt(ownerId),
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        totalFloors,
        hourlyRate,
        dailyRate,
        upiId: upiId ? upiId.trim() : null,
        photos: photos || null,
        createdAt
      })
      .returning();

    if (!newParkingArea || newParkingArea.length === 0) {
      return NextResponse.json({ 
        error: "Failed to create parking area",
        code: "SERVER_ERROR" 
      }, { status: 500 });
    }

    const parkingAreaId = newParkingArea[0].id;

    // Create floors and slots
    const createdFloors = [];

    for (let floorNum = 1; floorNum <= totalFloors; floorNum++) {
      // Create floor
      const newFloor = await db.insert(floors)
        .values({
          parkingAreaId,
          floorNumber: floorNum,
          totalSlots: slotsPerFloor,
          createdAt
        })
        .returning();

      if (!newFloor || newFloor.length === 0) {
        return NextResponse.json({ 
          error: `Failed to create floor ${floorNum}`,
          code: "SERVER_ERROR" 
        }, { status: 500 });
      }

      const floorId = newFloor[0].id;
      const createdSlots = [];

      // Create slots for this floor
      for (let slotNum = 1; slotNum <= slotsPerFloor; slotNum++) {
        const newSlot = await db.insert(slots)
          .values({
            floorId,
            slotNumber: slotNum,
            status: 'available',
            createdAt
          })
          .returning();

        if (!newSlot || newSlot.length === 0) {
          return NextResponse.json({ 
            error: `Failed to create slot ${slotNum} on floor ${floorNum}`,
            code: "SERVER_ERROR" 
          }, { status: 500 });
        }

        createdSlots.push({
          id: newSlot[0].id,
          slotNumber: newSlot[0].slotNumber,
          status: newSlot[0].status
        });
      }

      createdFloors.push({
        id: newFloor[0].id,
        floorNumber: newFloor[0].floorNumber,
        slots: createdSlots
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      parkingArea: {
        id: newParkingArea[0].id,
        name: newParkingArea[0].name,
        address: newParkingArea[0].address,
        floors: createdFloors
      },
      message: "Parking area created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      code: "SERVER_ERROR" 
    }, { status: 500 });
  }
}