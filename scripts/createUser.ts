/**
 * Simple one-user seed script.
 * Edit the USER object below, then run:
 *   npx ts-node scripts/createUser.ts
 *
 * Or add to package.json:
 *   "scripts": { "user:create": "ts-node scripts/createUser.ts" }
 * And run:
 *   npm run user:create
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import env from '../src/config/env';
import { User } from '../src/models/user.model';

type Role = 'employee' | 'manager' | 'admin';

// ==== EDIT THESE FIELDS EACH TIME ====
const USER = {
  name: 'Test User 1',
  email: 'test1@gmail.com',
  password: '111111',
  role: 'employee' as Role,

  // Optional fields (uncomment if needed)
  hourlyRate: 50,
  // clientId: '66edc5f4e7dce3f2a0b1c999',
  // siteIds: ['66edc5f4e7dce3f2a0b1c111', '66edc5f4e7dce3f2a0b1c222'],
};

const UPDATE_IF_EXISTS = false; // set to true if you want to update when the email already exists
// ====================================

async function main() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Check your .env');
  }

  await mongoose.connect(env.MONGODB_URI);

  const email = USER.email.toLowerCase().trim();
  if (!email || !USER.password || !USER.name) {
    throw new Error('Please set name, email, and password in USER.');
  }

  const existing = await User.findOne({ email }).select('+password');

  if (existing) {
    if (!UPDATE_IF_EXISTS) {
      console.log(`⚠️  User already exists for email ${email}. Set UPDATE_IF_EXISTS=true to overwrite.`);
      await mongoose.disconnect();
      return;
    }
    // update allowed fields
    existing.name = USER.name;
    existing.role = USER.role;
    // Only set optional fields if provided
    if ((USER as any).hourlyRate !== undefined) existing.hourlyRate = (USER as any).hourlyRate;
    if ((USER as any).clientId) existing.clientId = new mongoose.Types.ObjectId((USER as any).clientId);
    if ((USER as any).siteIds) {
      existing.siteIds = (USER as any).siteIds.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    // set new password (pre-save hook in model will hash)
    existing.password = USER.password;
    await existing.save();

    console.log('✅ Updated user:', {
      id: (existing._id as mongoose.Types.ObjectId).toString(),
      email: existing.email,
      name: existing.name,
      role: existing.role,
    });
  } else {
    // build payload for creation
    const payload: any = {
      name: USER.name,
      email,
      password: USER.password, // pre-save hook will hash
      role: USER.role,
    };
    if ((USER as any).hourlyRate !== undefined) payload.hourlyRate = (USER as any).hourlyRate;
    if ((USER as any).clientId) payload.clientId = new mongoose.Types.ObjectId((USER as any).clientId);
    if ((USER as any).siteIds) {
      payload.siteIds = (USER as any).siteIds.map((id: string) => new mongoose.Types.ObjectId(id));
    }

    const user = new User(payload);
    await user.save();

    console.log('✅ Created user:', {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  await mongoose.disconnect();
}

main()
  .catch(async (err) => {
    console.error('❌ Error:', err?.message || err);
    try { await mongoose.disconnect(); } catch { }
    process.exit(1);
  });
