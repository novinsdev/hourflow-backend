// src/config/payroll.config.ts
export const PAYROLL_CONFIG = {
  FREQUENCY: "biweekly",             // weekly | biweekly | monthly
  FIRST_PERIOD_END: 14,              // days 1–14
  SECOND_PERIOD_END: 28,             // days 15–28
  PAY_PROCESSING_DELAY: 5,           // days after period ends
  DEFAULT_HOURLY_RATE: 35,           // fallback if user has no hourlyRate
  HISTORY_PERIODS: 3,                // how many past pay periods to show
};
