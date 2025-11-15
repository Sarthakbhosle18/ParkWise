import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const sampleUsers = [
        {
            email: 'owner1@parking.com',
            passwordHash: bcrypt.hashSync('Password123!', 10),
            userType: 'owner',
            name: 'John Owner',
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            email: 'owner2@parking.com',
            passwordHash: bcrypt.hashSync('Password123!', 10),
            userType: 'owner',
            name: 'Sarah Manager',
            createdAt: new Date('2024-01-16').toISOString(),
        },
        {
            email: 'driver1@test.com',
            passwordHash: bcrypt.hashSync('Password123!', 10),
            userType: 'driver',
            name: 'Mike Driver',
            createdAt: new Date('2024-01-17').toISOString(),
        },
        {
            email: 'driver2@test.com',
            passwordHash: bcrypt.hashSync('Password123!', 10),
            userType: 'driver',
            name: 'Emma Wilson',
            createdAt: new Date('2024-01-18').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});