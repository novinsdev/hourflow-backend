// controllers/benefit.controller.ts
import { Request, Response } from 'express';
import { Benefit, IBenefit } from '../models/benefit.model';

type BenefitSeed = {
  name: string;
  shortLabel: string;
  category: IBenefit['category'];
  icon?: string;
  description: string;
  highlights: string[];
  eligibility?: string;
  isActive?: boolean;
  displayOrder?: number;
};

const DEFAULT_BENEFITS: BenefitSeed[] = [
  // HEALTH
  {
    name: 'Medical Insurance',
    shortLabel: 'Health',
    category: 'HEALTH',
    icon: '🏥',
    description:
      'Employer-sponsored medical plan with multiple coverage options for you and your eligible dependents.',
    highlights: [
      'Company contribution toward premiums',
      'In-network and out-of-network coverage',
      'Preventive care at low or no cost'
    ],
    eligibility: 'Full-time employees, first of the month after hire',
  },
  {
    name: 'Dental Insurance',
    shortLabel: 'Dental',
    category: 'HEALTH',
    icon: '🦷',
    description:
      'Comprehensive dental coverage for preventive, basic, and major services.',
    highlights: [
      '100% covered preventive exams and cleanings (in-network)',
      'Coverage for fillings and other basic services',
      'Orthodontia available on select plans'
    ],
    eligibility: 'Full-time employees, first of the month after hire',
  },
  {
    name: 'Vision Insurance',
    shortLabel: 'Vision',
    category: 'HEALTH',
    icon: '👓',
    description:
      'Vision plan that supports annual eye exams, lenses, frames, and contacts.',
    highlights: [
      'Annual eye exam benefit',
      'Allowance for frames or contacts',
      'Discounts on additional pairs'
    ],
    eligibility: 'Full-time employees, first of the month after hire',
  },

  // FINANCIAL
  {
    name: '401(k) Retirement Plan',
    shortLabel: '401(k)',
    category: 'FINANCIAL',
    icon: '💰',
    description:
      'Pre-tax and Roth 401(k) retirement plan with an employer match to help you save for the future.',
    highlights: [
      'Pre-tax and Roth contribution options',
      'Employer match (customize % as needed)',
      'Vesting schedule configurable per policy'
    ],
    eligibility: 'Employees meeting plan eligibility requirements',
  },
  {
    name: 'Life & AD&D Insurance',
    shortLabel: 'Life',
    category: 'FINANCIAL',
    icon: '🛡️',
    description:
      'Company-paid basic life and accidental death & dismemberment (AD&D) coverage.',
    highlights: [
      'Company-paid base coverage',
      'Optional supplemental coverage for employees and dependents',
      'Flexible beneficiary designations'
    ],
    eligibility: 'Full-time employees',
  },

  // TIME_OFF
  {
    name: 'Paid Time Off (PTO)',
    shortLabel: 'PTO',
    category: 'TIME_OFF',
    icon: '🌴',
    description:
      'Flexible paid time off for vacation, personal time, and rest.',
    highlights: [
      'Accrued or front-loaded bank (per company policy)',
      'Use for vacation, personal appointments, and rest',
      'Manager-approved scheduling for coverage'
    ],
    eligibility: 'Employees as defined by policy',
  },
  {
    name: 'Paid Company Holidays',
    shortLabel: 'Holidays',
    category: 'TIME_OFF',
    icon: '🎉',
    description:
      'A standard set of paid company holidays each year.',
    highlights: [
      'Core national holidays',
      'Additional floating holidays configurable',
    ],
    eligibility: 'Full-time employees (pro-rated for part-time where applicable)',
  },
  {
    name: 'Sick Time',
    shortLabel: 'Sick Leave',
    category: 'TIME_OFF',
    icon: '🤒',
    description:
      'Paid time away from work when you or your dependents are ill.',
    highlights: [
      'Compliant with local sick leave regulations',
      'Can be used for family care',
    ],
    eligibility: 'Employees as defined by local law and policy',
  },

  // WELLNESS / PERKS
  {
    name: 'Employee Assistance Program (EAP)',
    shortLabel: 'EAP',
    category: 'WELLNESS',
    icon: '💬',
    description:
      'Confidential support for mental health, financial counseling, and life events.',
    highlights: [
      'Confidential 24/7 access',
      'Short-term counseling sessions',
      'Resources for legal and financial topics'
    ],
    eligibility: 'All employees',
  },
  {
    name: 'Learning & Development',
    shortLabel: 'L&D',
    category: 'WELLNESS',
    icon: '🎓',
    description:
      'Support for professional development through courses, certifications, and learning resources.',
    highlights: [
      'Annual learning budget (customize amount)',
      'Access to online learning platforms',
      'Role-specific training and career pathing'
    ],
    eligibility: 'Employees meeting program guidelines',
  },
];

async function ensureSeeded() {
  const count = await Benefit.countDocuments().exec();
  if (count > 0) return;

  await Benefit.insertMany(
    DEFAULT_BENEFITS.map((b, index) => ({
      ...b,
      isActive: b.isActive ?? true,
      displayOrder: b.displayOrder ?? index,
    }))
  );
}

export async function getAllBenefits(_req: Request, res: Response) {
  try {
    await ensureSeeded();
    const benefits = await Benefit.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean()
      .exec();

    res.json(benefits);
  } catch (err) {
    console.error('getAllBenefits error', err);
    res.status(500).json({ error: 'failed_to_fetch_benefits' });
  }
}
