import { db } from '@/db';
import { parkingAreas } from '@/db/schema';

async function main() {
    const sampleParkingAreas = [
        {
            ownerId: 1,
            name: 'Downtown Parking Plaza',
            address: '123 MG Road, Connaught Place, New Delhi, 110001',
            latitude: 28.6139,
            longitude: 77.2090,
            totalFloors: 3,
            hourlyRate: 50,
            dailyRate: 500,
            upiId: 'downtown@parking',
            photos: [
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400',
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400',
                'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400'
            ],
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            ownerId: 1,
            name: 'Mall Parking Complex',
            address: '456 Saket District Centre, New Delhi, 110017',
            latitude: 28.6280,
            longitude: 77.2200,
            totalFloors: 2,
            hourlyRate: 40,
            dailyRate: 400,
            upiId: 'mall@parking',
            photos: [
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400',
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400'
            ],
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            ownerId: 2,
            name: 'Airport Parking Terminal',
            address: 'Terminal 3, Indira Gandhi International Airport, New Delhi, 110037',
            latitude: 28.5562,
            longitude: 77.1000,
            totalFloors: 4,
            hourlyRate: 60,
            dailyRate: 600,
            upiId: 'airport@parking',
            photos: [
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400',
                'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400',
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400',
                'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400'
            ],
            createdAt: new Date('2024-02-01').toISOString(),
        }
    ];

    await db.insert(parkingAreas).values(sampleParkingAreas);
    
    console.log('✅ Parking areas seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});