import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { parkingAreas, floors, slots, ownerProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// City coordinates
const CITY_COORDINATES = {
  kolhapur: { lat: 16.7050, lng: 74.2433, name: "Kolhapur" },
  mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune" },
  delhi: { lat: 28.6139, lng: 77.2090, name: "Delhi" },
  sangli: { lat: 16.8524, lng: 74.5815, name: "Sangli" },
};

// Known parking locations for each city
const KNOWN_PARKING_LOCATIONS = {
  kolhapur: [
    {
      name: "Mahalaxmi Temple Parking",
      address: "Mahalaxmi Temple Road, Kolhapur, Maharashtra 416012",
      latitude: 16.6951,
      longitude: 74.2341,
    },
    {
      name: "Rankala Lake Parking Area",
      address: "Rankala Lake, Kolhapur, Maharashtra 416012",
      latitude: 16.6956,
      longitude: 74.2425,
    },
    {
      name: "New Palace Parking",
      address: "Near New Palace, Kolhapur, Maharashtra 416003",
      latitude: 16.7035,
      longitude: 74.2400,
    },
    {
      name: "Shivaji University Parking",
      address: "Shivaji University Campus, Kolhapur, Maharashtra 416004",
      latitude: 16.7065,
      longitude: 74.2354,
    },
    {
      name: "Station Road Parking Complex",
      address: "Station Road, Kolhapur, Maharashtra 416001",
      latitude: 16.7047,
      longitude: 74.2322,
    },
  ],
  mumbai: [
    {
      name: "Gateway of India Parking",
      address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
      latitude: 18.9220,
      longitude: 72.8347,
    },
    {
      name: "Bandra Kurla Complex Parking",
      address: "Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
      latitude: 19.0625,
      longitude: 72.8682,
    },
    {
      name: "Dadar Station Parking",
      address: "Dadar West, Mumbai, Maharashtra 400028",
      latitude: 19.0176,
      longitude: 72.8450,
    },
    {
      name: "Andheri Metro Parking",
      address: "Andheri West, Mumbai, Maharashtra 400053",
      latitude: 19.1197,
      longitude: 72.8464,
    },
    {
      name: "Phoenix Mall Parking",
      address: "Lower Parel, Mumbai, Maharashtra 400013",
      latitude: 18.9966,
      longitude: 72.8304,
    },
    {
      name: "Churchgate Station Parking",
      address: "Churchgate, Mumbai, Maharashtra 400020",
      latitude: 18.9324,
      longitude: 72.8265,
    },
    {
      name: "Juhu Beach Parking",
      address: "Juhu Beach, Mumbai, Maharashtra 400049",
      latitude: 19.0969,
      longitude: 72.8269,
    },
    {
      name: "CST Station Parking",
      address: "Chhatrapati Shivaji Terminus, Mumbai, Maharashtra 400001",
      latitude: 18.9398,
      longitude: 72.8355,
    },
  ],
  pune: [
    {
      name: "Shaniwar Wada Parking",
      address: "Shaniwar Peth, Pune, Maharashtra 411030",
      latitude: 18.5196,
      longitude: 73.8553,
    },
    {
      name: "Pune Station Parking",
      address: "Railway Station, Pune, Maharashtra 411001",
      latitude: 18.5282,
      longitude: 73.8740,
    },
    {
      name: "FC Road Parking",
      address: "Fergusson College Road, Pune, Maharashtra 411004",
      latitude: 18.5204,
      longitude: 73.8389,
    },
    {
      name: "Koregaon Park Parking",
      address: "Koregaon Park, Pune, Maharashtra 411001",
      latitude: 18.5367,
      longitude: 73.8901,
    },
    {
      name: "Hinjewadi IT Park Parking",
      address: "Hinjewadi Phase 1, Pune, Maharashtra 411057",
      latitude: 18.5912,
      longitude: 73.7389,
    },
    {
      name: "Phoenix Market City Parking",
      address: "Viman Nagar, Pune, Maharashtra 411014",
      latitude: 18.5679,
      longitude: 73.9143,
    },
    {
      name: "Swargate Bus Stand Parking",
      address: "Swargate, Pune, Maharashtra 411042",
      latitude: 18.5018,
      longitude: 73.8636,
    },
  ],
  delhi: [
    {
      name: "Connaught Place Parking",
      address: "Connaught Place, New Delhi, Delhi 110001",
      latitude: 28.6315,
      longitude: 77.2167,
    },
    {
      name: "India Gate Parking",
      address: "Rajpath, India Gate, New Delhi, Delhi 110001",
      latitude: 28.6129,
      longitude: 77.2295,
    },
    {
      name: "Chandni Chowk Parking",
      address: "Chandni Chowk, Old Delhi, Delhi 110006",
      latitude: 28.6506,
      longitude: 77.2303,
    },
    {
      name: "Saket Metro Parking",
      address: "Saket, New Delhi, Delhi 110017",
      latitude: 28.5244,
      longitude: 77.2066,
    },
    {
      name: "Cyber Hub Parking Gurgaon",
      address: "DLF Cyber City, Gurgaon, Haryana 122002",
      latitude: 28.4950,
      longitude: 77.0890,
    },
    {
      name: "Hauz Khas Metro Parking",
      address: "Hauz Khas, New Delhi, Delhi 110016",
      latitude: 28.5494,
      longitude: 77.2001,
    },
    {
      name: "Rajiv Chowk Metro Parking",
      address: "Rajiv Chowk, New Delhi, Delhi 110001",
      latitude: 28.6328,
      longitude: 77.2197,
    },
    {
      name: "Karol Bagh Market Parking",
      address: "Karol Bagh, New Delhi, Delhi 110005",
      latitude: 28.6512,
      longitude: 77.1910,
    },
  ],
  sangli: [
    {
      name: "Sangli Railway Station Parking",
      address: "Railway Station Road, Sangli, Maharashtra 416416",
      latitude: 16.8569,
      longitude: 74.5642,
    },
    {
      name: "Ganpati Temple Parking",
      address: "Market Yard, Sangli, Maharashtra 416416",
      latitude: 16.8601,
      longitude: 74.5735,
    },
    {
      name: "Sangli Bus Stand Parking",
      address: "Central Bus Stand, Sangli, Maharashtra 416416",
      latitude: 16.8545,
      longitude: 74.5689,
    },
    {
      name: "Miraj Medical College Parking",
      address: "Miraj, Sangli, Maharashtra 416410",
      latitude: 16.8270,
      longitude: 74.6450,
    },
    {
      name: "Krishna Valley Mall Parking",
      address: "Vishrambag, Sangli, Maharashtra 416415",
      latitude: 16.8498,
      longitude: 74.5812,
    },
  ],
};

interface GooglePlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // If no body or invalid JSON, default to importing all cities
      body = { city: "all" };
    }
    
    const { city } = body;

    const cityKey = city?.toLowerCase() || "all";
    const citiesToImport = cityKey === "all" ? Object.keys(KNOWN_PARKING_LOCATIONS) : [cityKey];

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Get or create a system owner for imported parking areas
    let systemOwner = await db
      .select()
      .from(users)
      .where(eq(users.email, "system@parking.com"))
      .limit(1);

    if (systemOwner.length === 0) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: "system@parking.com",
          passwordHash: "system",
          userType: "owner",
          name: "System (Auto Import)",
          createdAt: new Date().toISOString(),
        })
        .returning();

      await db.insert(ownerProfiles).values({
        userId: newUser.id,
        phone: "0000000000",
        createdAt: new Date().toISOString(),
      });

      systemOwner = [newUser];
    }

    const [ownerProfile] = await db
      .select()
      .from(ownerProfiles)
      .where(eq(ownerProfiles.userId, systemOwner[0].id))
      .limit(1);

    const allImportedParking = [];

    for (const currentCity of citiesToImport) {
      const cityData = CITY_COORDINATES[currentCity as keyof typeof CITY_COORDINATES];
      const parkingLocations = KNOWN_PARKING_LOCATIONS[currentCity as keyof typeof KNOWN_PARKING_LOCATIONS];

      if (!cityData || !parkingLocations) {
        console.log(`Skipping unknown city: ${currentCity}`);
        continue;
      }

      console.log(`Importing parking for ${cityData.name}...`);

      for (const location of parkingLocations) {
        // Check if parking already exists
        const existing = await db
          .select()
          .from(parkingAreas)
          .where(eq(parkingAreas.name, location.name))
          .limit(1);

        if (existing.length > 0) {
          console.log(`Skipping existing: ${location.name}`);
          continue;
        }

        // Generate realistic parking data
        const totalFloors = Math.floor(Math.random() * 3) + 1;
        const slotsPerFloor = Math.floor(Math.random() * 30) + 20;
        const baseRate = Math.floor(Math.random() * 30) + 20;

        // Create parking area
        const [newParkingArea] = await db
          .insert(parkingAreas)
          .values({
            ownerId: ownerProfile.id,
            name: location.name,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            totalFloors: totalFloors,
            hourlyRate: baseRate,
            dailyRate: baseRate * 8,
            upiId: `${currentCity}@parking`,
            photos: JSON.stringify([]),
            createdAt: new Date().toISOString(),
          })
          .returning();

        // Create floors and slots
        for (let floorNum = 1; floorNum <= totalFloors; floorNum++) {
          const [newFloor] = await db
            .insert(floors)
            .values({
              parkingAreaId: newParkingArea.id,
              floorNumber: floorNum,
              totalSlots: slotsPerFloor,
              createdAt: new Date().toISOString(),
            })
            .returning();

          const slotValues = [];
          for (let slotNum = 1; slotNum <= slotsPerFloor; slotNum++) {
            const rand = Math.random();
            let status = "available";
            if (rand < 0.1) status = "occupied";
            else if (rand < 0.2) status = "booked";

            slotValues.push({
              floorId: newFloor.id,
              slotNumber: slotNum,
              status: status,
              createdAt: new Date().toISOString(),
            });
          }

          await db.insert(slots).values(slotValues);
        }

        allImportedParking.push({
          id: newParkingArea.id,
          name: newParkingArea.name,
          address: newParkingArea.address,
          city: cityData.name,
          floors: totalFloors,
          totalSlots: totalFloors * slotsPerFloor,
        });

        console.log(`Imported: ${location.name} in ${cityData.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${allImportedParking.length} parking areas`,
      imported: allImportedParking,
      cities: citiesToImport.map((c) => CITY_COORDINATES[c as keyof typeof CITY_COORDINATES]?.name),
    });
  } catch (error) {
    console.error("Error importing parking:", error);
    return NextResponse.json(
      { error: "Failed to import parking data", details: String(error) },
      { status: 500 }
    );
  }
}