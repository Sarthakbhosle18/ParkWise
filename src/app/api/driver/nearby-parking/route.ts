import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parkingAreas, floors, slots } from '@/db/schema';
import { eq } from 'drizzle-orm';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// City presets for categorization
const CITY_PRESETS = {
  kolhapur: { lat: 16.7050, lng: 74.2433, name: "Kolhapur" },
  mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune" },
  delhi: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
  sangli: { lat: 16.8524, lng: 74.5815, name: "Sangli" },
};

function getNearestCity(lat: number, lng: number): string {
  let nearestCity = "Unknown";
  let minDistance = Infinity;

  Object.entries(CITY_PRESETS).forEach(([key, city]) => {
    const distance = getDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  });

  return nearestCity;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');
    const showAll = searchParams.get('showAll') === 'true';

    // Validate required parameters
    if (!latParam || !lngParam) {
      return NextResponse.json({
        error: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES'
      }, { status: 400 });
    }

    // Parse and validate coordinates
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) : null;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({
        error: 'Invalid latitude or longitude',
        code: 'INVALID_COORDINATES'
      }, { status: 400 });
    }

    if (radius !== null && (isNaN(radius) || radius <= 0)) {
      return NextResponse.json({
        error: 'Invalid radius value',
        code: 'INVALID_RADIUS'
      }, { status: 400 });
    }

    // Performance Optimization: 3 Batch Queries
    // 1. Fetch all parking areas (already done)
    const allParkingAreas = await db.select().from(parkingAreas);

    // 2. Fetch all floors
    const allFloors = await db.select().from(floors);

    // 3. Fetch all slots
    const allSlots = await db.select().from(slots);

    // Group slots by floorId in memory
    const slotsByFloorId = new Map<number, { total: number; available: number }>();
    allSlots.forEach(slot => {
      if (!slotsByFloorId.has(slot.floorId)) {
        slotsByFloorId.set(slot.floorId, { total: 0, available: 0 });
      }
      const floorStats = slotsByFloorId.get(slot.floorId)!;
      floorStats.total += 1;
      if (slot.status === 'available') {
        floorStats.available += 1;
      }
    });

    // Group floors by parkingAreaId in memory
    const floorsByAreaId = new Map<number, typeof allFloors>();
    allFloors.forEach(floor => {
      if (!floorsByAreaId.has(floor.parkingAreaId)) {
        floorsByAreaId.set(floor.parkingAreaId, []);
      }
      floorsByAreaId.get(floor.parkingAreaId)!.push(floor);
    });

    // Process each parking area (zero DB queries in this loop)
    const processedAreas = allParkingAreas.map(area => {
      // Calculate distance from driver's location
      const distance = getDistance(lat, lng, area.latitude, area.longitude);

      // Determine the city this parking area belongs to
      const city = getNearestCity(area.latitude, area.longitude);

      // Get all floors for this parking area from memory
      const areaFloors = floorsByAreaId.get(area.id) || [];

      // Get all slots for all floors and count available ones
      let availableSlots = 0;
      let totalSlots = 0;

      for (const floor of areaFloors) {
        const floorStats = slotsByFloorId.get(floor.id) || { total: 0, available: 0 };
        totalSlots += floorStats.total;
        availableSlots += floorStats.available;
      }

      return {
        id: area.id,
        name: area.name,
        address: area.address,
        city,
        latitude: area.latitude,
        longitude: area.longitude,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        totalFloors: area.totalFloors,
        hourlyRate: area.hourlyRate,
        dailyRate: area.dailyRate,
        photos: area.photos,
        availableSlots,
        totalSlots
      };
    });

    // Filter by radius if specified and not showing all
    let filteredAreas = processedAreas;
    if (!showAll && radius !== null) {
      filteredAreas = processedAreas.filter(area => area.distance <= radius);
    }

    // Sort by distance
    filteredAreas.sort((a, b) => a.distance - b.distance);

    return NextResponse.json(filteredAreas, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'SERVER_ERROR'
    }, { status: 500 });
  }
}