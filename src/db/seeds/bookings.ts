import { db } from '@/db';
import { bookings } from '@/db/schema';

async function main() {
    const now = new Date();
    
    // Helper function to add hours to a date
    const addHours = (date: Date, hours: number): Date => {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    };
    
    // Helper function to add days to a date
    const addDays = (date: Date, days: number): Date => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };
    
    // Calculate dates
    const tomorrow = addDays(now, 1);
    const yesterday = addDays(now, -1);
    const twoDaysAgo = addDays(now, -2);
    const threeDaysLater = addDays(now, 3);
    
    // Record 1: Tomorrow 10am-4pm
    const record1Start = new Date(tomorrow);
    record1Start.setHours(10, 0, 0, 0);
    const record1End = addHours(record1Start, 6);
    
    // Record 2: Tomorrow 2pm-8pm
    const record2Start = new Date(tomorrow);
    record2Start.setHours(14, 0, 0, 0);
    const record2End = addHours(record2Start, 6);
    
    // Record 3: Yesterday 9am-6pm
    const record3Start = new Date(yesterday);
    record3Start.setHours(9, 0, 0, 0);
    const record3End = addHours(record3Start, 9);
    
    // Record 4: Today 8am to 3 days later 8am
    const record4Start = new Date(now);
    record4Start.setHours(8, 0, 0, 0);
    const record4End = new Date(threeDaysLater);
    record4End.setHours(8, 0, 0, 0);
    
    // Record 5: 2 days ago 10am-2pm
    const record5Start = new Date(twoDaysAgo);
    record5Start.setHours(10, 0, 0, 0);
    const record5End = addHours(record5Start, 4);
    
    const sampleBookings = [
        {
            driverId: 3,
            slotId: 20,
            parkingAreaId: 1,
            vehicleType: 'car',
            vehicleNumber: 'DL01AB1234',
            startTime: record1Start.toISOString(),
            endTime: record1End.toISOString(),
            durationHours: 6,
            totalAmount: 300,
            paymentMethod: 'razorpay',
            paymentStatus: 'completed',
            paymentId: 'pay_' + Math.random().toString(36).substring(2, 15),
            bookingStatus: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            driverId: 4,
            slotId: 40,
            parkingAreaId: 1,
            vehicleType: 'bike',
            vehicleNumber: 'DL02CD5678',
            startTime: record2Start.toISOString(),
            endTime: record2End.toISOString(),
            durationHours: 6,
            totalAmount: 300,
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            paymentId: null,
            bookingStatus: 'active',
            createdAt: new Date().toISOString(),
        },
        {
            driverId: 3,
            slotId: 5,
            parkingAreaId: 2,
            vehicleType: 'car',
            vehicleNumber: 'DL01AB1234',
            startTime: record3Start.toISOString(),
            endTime: record3End.toISOString(),
            durationHours: 9,
            totalAmount: 360,
            paymentMethod: 'razorpay',
            paymentStatus: 'completed',
            paymentId: 'pay_' + Math.random().toString(36).substring(2, 15),
            bookingStatus: 'completed',
            createdAt: yesterday.toISOString(),
        },
        {
            driverId: 4,
            slotId: 75,
            parkingAreaId: 2,
            vehicleType: 'car',
            vehicleNumber: 'DL02CD5678',
            startTime: record4Start.toISOString(),
            endTime: record4End.toISOString(),
            durationHours: 72,
            totalAmount: 1200,
            paymentMethod: 'razorpay',
            paymentStatus: 'completed',
            paymentId: 'pay_' + Math.random().toString(36).substring(2, 15),
            bookingStatus: 'active',
            createdAt: now.toISOString(),
        },
        {
            driverId: 3,
            slotId: 10,
            parkingAreaId: 3,
            vehicleType: 'car',
            vehicleNumber: 'DL01AB1234',
            startTime: record5Start.toISOString(),
            endTime: record5End.toISOString(),
            durationHours: 4,
            totalAmount: 240,
            paymentMethod: 'razorpay',
            paymentStatus: 'failed',
            paymentId: null,
            bookingStatus: 'cancelled',
            createdAt: twoDaysAgo.toISOString(),
        }
    ];

    await db.insert(bookings).values(sampleBookings);
    
    console.log('✅ Bookings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});