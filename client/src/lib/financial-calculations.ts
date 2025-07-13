import { LoanInput, PaymentRow, LoanSummary } from "@shared/schema";
import { adjustPaymentDate, getDaysBetween } from "./business-days";

export function calculatePaymentAmount(
  principal: number,
  annualRate: number,
  totalPayments: number,
  paymentsPerYear: number,
  compoundingFrequency: number = 2
): number {
  // Convert annual rate to effective rate
  const effectiveRate = Math.pow(1 + annualRate / (100 * compoundingFrequency), compoundingFrequency / paymentsPerYear) - 1;
  
  if (effectiveRate === 0) {
    return principal / totalPayments;
  }
  
  const payment = principal * (effectiveRate * Math.pow(1 + effectiveRate, totalPayments)) / 
    (Math.pow(1 + effectiveRate, totalPayments) - 1);
  
  return payment;
}

export function calculateAmortizationSchedule(input: LoanInput): {
  schedule: PaymentRow[];
  summary: LoanSummary;
} {
  const {
    loanAmount,
    annualInterestRate,
    amortizationMonths,
    paymentsPerYear,
    startDate,
    firstPaymentDate,
    rateTermMaturityDate,
    compoundingFrequency
  } = input;

  const totalPayments = Math.floor((amortizationMonths / 12) * paymentsPerYear);
  const monthlyPayment = calculatePaymentAmount(
    loanAmount,
    annualInterestRate,
    totalPayments,
    paymentsPerYear,
    compoundingFrequency
  );

  // Calculate payment frequency in days
  const paymentFrequencyDays = Math.round(365.25 / paymentsPerYear);
  
  const schedule: PaymentRow[] = [];
  let currentBalance = loanAmount;
  let cumulativeInterest = 0;
  let previousPaymentDate = new Date(startDate);
  
  const rateTermMaturity = new Date(rateTermMaturityDate);
  let rateTermInterest = 0;
  let rateTermPrincipal = 0;

  for (let i = 1; i <= totalPayments; i++) {
    // Calculate next payment date
    const scheduledDate = new Date(firstPaymentDate);
    scheduledDate.setDate(scheduledDate.getDate() + (i - 1) * paymentFrequencyDays);
    const adjustedPaymentDate = adjustPaymentDate(scheduledDate);
    
    // Calculate days between payments
    const daysBetween = getDaysBetween(previousPaymentDate, adjustedPaymentDate);
    
    // Calculate interest for this period
    const dailyRate = annualInterestRate / 100 / 365.25;
    const interestPayment = currentBalance * dailyRate * daysBetween;
    
    // Calculate principal payment
    let principalPayment = monthlyPayment - interestPayment;
    
    // Handle final payment
    if (i === totalPayments || principalPayment > currentBalance) {
      principalPayment = currentBalance;
    }
    
    const endingBalance = Math.max(0, currentBalance - principalPayment);
    cumulativeInterest += interestPayment;
    
    // Track rate term totals
    if (adjustedPaymentDate <= rateTermMaturity) {
      rateTermInterest += interestPayment;
      rateTermPrincipal += principalPayment;
    }
    
    schedule.push({
      paymentNumber: i,
      paymentDate: adjustedPaymentDate,
      beginningBalance: currentBalance,
      scheduledPayment: principalPayment + interestPayment,
      principalPayment,
      interestPayment,
      endingBalance,
      cumulativeInterest,
      daysBetweenPayments: daysBetween,
    });
    
    currentBalance = endingBalance;
    previousPaymentDate = adjustedPaymentDate;
    
    if (currentBalance <= 0.01) break; // Stop when loan is essentially paid off
  }

  const summary: LoanSummary = {
    monthlyPayment,
    totalInterest: cumulativeInterest,
    totalPayments: schedule.reduce((sum, row) => sum + row.scheduledPayment, 0),
    rateTermInterest,
    rateTermPrincipal,
    numberOfPayments: schedule.length,
  };

  return { schedule, summary };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(rate: number): string {
  return `${rate.toFixed(4)}%`;
}
