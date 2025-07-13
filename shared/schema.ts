import { pgTable, text, serial, decimal, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const loanCalculations = pgTable("loan_calculations", {
  id: serial("id").primaryKey(),
  loanAmount: decimal("loan_amount", { precision: 15, scale: 2 }).notNull(),
  annualInterestRate: decimal("annual_interest_rate", { precision: 8, scale: 4 }).notNull(),
  rateTermMonths: integer("rate_term_months").notNull(),
  amortizationMonths: integer("amortization_months").notNull(),
  paymentsPerYear: integer("payments_per_year").notNull(),
  startDate: date("start_date").notNull(),
  firstPaymentDate: date("first_payment_date").notNull(),
  rateTermMaturityDate: date("rate_term_maturity_date").notNull(),
  compoundingFrequency: integer("compounding_frequency").notNull().default(2),
  paymentType: text("payment_type").notNull().default("end"),
  calculatedAt: date("calculated_at").notNull(),
});

export const insertLoanCalculationSchema = createInsertSchema(loanCalculations).omit({
  id: true,
  calculatedAt: true,
});

export type InsertLoanCalculation = z.infer<typeof insertLoanCalculationSchema>;
export type LoanCalculation = typeof loanCalculations.$inferSelect;

// Validation schemas for the calculator
export const loanInputSchema = z.object({
  loanAmount: z.number().min(1000, "Loan amount must be at least $1,000").max(100000000, "Loan amount cannot exceed $100,000,000"),
  annualInterestRate: z.number().min(0.01, "Interest rate must be at least 0.01%").max(50, "Interest rate cannot exceed 50%"),
  rateTermMonths: z.number().min(1, "Rate term must be at least 1 month").max(600, "Rate term cannot exceed 600 months"),
  amortizationMonths: z.number().min(1, "Amortization period must be at least 1 month").max(600, "Amortization period cannot exceed 600 months"),
  paymentsPerYear: z.number().int().min(1).max(365),
  startDate: z.string().min(1, "Start date is required"),
  firstPaymentDate: z.string().min(1, "First payment date is required"),
  rateTermMaturityDate: z.string().min(1, "Rate term maturity date is required"),
  compoundingFrequency: z.number().int().min(1).max(365).default(2),
  paymentType: z.enum(["end", "beginning"]).default("end"),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const firstPaymentDate = new Date(data.firstPaymentDate);
  const rateTermMaturityDate = new Date(data.rateTermMaturityDate);
  
  return firstPaymentDate >= startDate && rateTermMaturityDate > startDate;
}, {
  message: "Payment dates must be logical (first payment >= start date, maturity > start date)",
});

export type LoanInput = z.infer<typeof loanInputSchema>;

// Amortization schedule types
export interface PaymentRow {
  paymentNumber: number;
  paymentDate: Date;
  beginningBalance: number;
  scheduledPayment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
  cumulativeInterest: number;
  daysBetweenPayments: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalInterest: number;
  totalPayments: number;
  rateTermInterest: number;
  rateTermPrincipal: number;
  numberOfPayments: number;
}
