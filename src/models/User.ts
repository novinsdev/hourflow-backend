import mongoose, { Schema, InferSchemaType } from 'mongoose';

const UserSchema = new Schema({
  role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee', index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  photoUrl: { type: String },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  siteIds: [{ type: Schema.Types.ObjectId, ref: 'Site' }],
  hourlyRate: { type: Number },
}, { timestamps: true });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: any };

export const User = mongoose.model('User', UserSchema);
