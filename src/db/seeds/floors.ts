import { db } from '@/db';
import { floors } from '@/db/schema';

async function main() {
    const sampleFloors = [
        // Parking Area 1 (Downtown Parking Plaza) - 3 floors with 20 slots each
        {
            parkingAreaId: 1,
            floorNumber: 1,
            totalSlots: 20,
            createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 1,
            floorNumber: 2,
            totalSlots: 20,
            createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 1,
            floorNumber: 3,
            totalSlots: 20,
            createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
        },
        // Parking Area 2 (Mall Parking Complex) - 2 floors with 15 slots each
        {
            parkingAreaId: 2,
            floorNumber: 1,
            totalSlots: 15,
            createdAt: new Date('2024-01-12T09:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 2,
            floorNumber: 2,
            totalSlots: 15,
            createdAt: new Date('2024-01-12T09:00:00Z').toISOString(),
        },
        // Parking Area 3 (Airport Parking Terminal) - 4 floors with 25 slots each
        {
            parkingAreaId: 3,
            floorNumber: 1,
            totalSlots: 25,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 3,
            floorNumber: 2,
            totalSlots: 25,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 3,
            floorNumber: 3,
            totalSlots: 25,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            parkingAreaId: 3,
            floorNumber: 4,
            totalSlots: 25,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
    ];

    await db.insert(floors).values(sampleFloors);
    
    console.log('✅ Floors seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});