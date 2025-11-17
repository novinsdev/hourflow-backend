// models/benefit.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type BenefitCategory = 'HEALTH' | 'FINANCIAL' | 'TIME_OFF' | 'WELLNESS';

export interface IBenefit extends Document {
  name: string;
  shortLabel: string;
  category: BenefitCategory;
  icon?: string;
  description: string;
  highlights: string[];
  eligibility?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BenefitSchema = new Schema<IBenefit>(
  {
    name: { type: String, required: true, trim: true },
    shortLabel: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['HEALTH', 'FINANCIAL', 'TIME_OFF', 'WELLNESS'],
      required: true,
    },
    icon: { type: String },
    description: { type: String, required: true },
    highlights: { type: [String], default: [] },
    eligibility: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Benefit: Model<IBenefit> =
  mongoose.models.Benefit || mongoose.model<IBenefit>('Benefit', BenefitSchema);
