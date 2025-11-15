import { db } from '@/db';
import { ownerProfiles } from '@/db/schema';

async function main() {
    const sampleOwnerProfiles = [
        {
            userId: 1,
            phone: '+91 98765 43210',
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            userId: 2,
            phone: '+91 98765 43211',
            createdAt: new Date('2024-01-16T10:00:00Z').toISOString(),
        },
    ];

    await db.insert(ownerProfiles).values(sampleOwnerProfiles);
    
    console.log('✅ Owner profiles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});