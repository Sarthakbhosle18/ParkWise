import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table - main authentication table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  userType: text('user_type').notNull(), // 'owner' or 'driver'
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

// Owner profiles table
export const ownerProfiles = sqliteTable('owner_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  phone: text('phone'),
  createdAt: text('created_at').notNull(),
});

// Parking areas table
export const parkingAreas = sqliteTable('parking_areas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => ownerProfiles.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  totalFloors: integer('total_floors').notNull(),
  hourlyRate: real('hourly_rate').notNull(),
  dailyRate: real('daily_rate').notNull(),
  upiId: text('upi_id'),
  photos: text('photos', { mode: 'json' }), // JSON array of photo URLs
  createdAt: text('created_at').notNull(),
});

// Floors table
export const floors = sqliteTable('floors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parkingAreaId: integer('parking_area_id').notNull().references(() => parkingAreas.id),
  floorNumber: integer('floor_number').notNull(),
  totalSlots: integer('total_slots').notNull(),
  createdAt: text('created_at').notNull(),
});

// Slots table
export const slots = sqliteTable('slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  floorId: integer('floor_id').notNull().references(() => floors.id),
  slotNumber: integer('slot_number').notNull(),
  status: text('status').notNull().default('available'), // 'available', 'booked', 'occupied'
  createdAt: text('created_at').notNull(),
});

// Bookings table
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driverId: integer('driver_id').notNull().references(() => users.id),
  slotId: integer('slot_id').notNull().references(() => slots.id),
  parkingAreaId: integer('parking_area_id').notNull().references(() => parkingAreas.id),
  vehicleType: text('vehicle_type').notNull(),
  vehicleNumber: text('vehicle_number').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  durationHours: real('duration_hours').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'razorpay', 'cash'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'completed', 'failed'
  paymentId: text('payment_id'),
  bookingStatus: text('booking_status').notNull().default('active'), // 'active', 'completed', 'cancelled'
  createdAt: text('created_at').notNull(),
});