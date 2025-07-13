import { isCanadianHoliday } from "./canadian-holidays";

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isCanadianHoliday(date);
}

export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

export function adjustPaymentDate(date: Date): Date {
  if (isBusinessDay(date)) {
    return new Date(date);
  }
  
  return getNextBusinessDay(date);
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}
