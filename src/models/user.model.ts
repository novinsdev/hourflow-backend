import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'employee' | 'manager' | 'admin';
export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT";

export interface IUser extends Document {
  role: UserRole;
  name: string;
  email: string;
  clientId?: mongoose.Types.ObjectId;
  siteIds?: mongoose.Types.ObjectId[];
  hourlyRate?: number;
  password: string; // bcrypt hash
  createdAt: Date;
  shiftType?: ShiftType;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['employee', 'manager', 'admin'], required: true, default: 'employee' },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    siteIds: [{ type: Schema.Types.ObjectId, ref: 'Site' }],
    shiftType: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "NIGHT"],
      default: undefined, // user may not be assigned yet
    },
    hourlyRate: { type: Number },
    password: { type: String, required: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

UserSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
