import { format } from "date-fns";

// Canadian statutory holidays
export function getCanadianHolidays(year: number): Date[] {
  const holidays: Date[] = [];
  
  // New Year's Day - January 1
  holidays.push(new Date(year, 0, 1));
  
  // Family Day (3rd Monday in February) - not all provinces
  const familyDay = new Date(year, 1, 1);
  const firstMonday = familyDay.getDay() === 1 ? familyDay : new Date(year, 1, 8 - familyDay.getDay());
  holidays.push(new Date(firstMonday.getTime() + 14 * 24 * 60 * 60 * 1000));
  
  // Good Friday (2 days before Easter)
  const easter = calculateEaster(year);
  holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000));
  
  // Easter Monday (day after Easter)
  holidays.push(new Date(easter.getTime() + 24 * 60 * 60 * 1000));
  
  // Victoria Day (Monday before May 25)
  const victoria = new Date(year, 4, 25);
  const victoriaMonday = new Date(victoria.getTime() - ((victoria.getDay() + 6) % 7) * 24 * 60 * 60 * 1000);
  holidays.push(victoriaMonday);
  
  // Canada Day - July 1
  let canadaDay = new Date(year, 6, 1);
  if (canadaDay.getDay() === 0) { // If Sunday, observed on Monday
    canadaDay = new Date(year, 6, 2);
  }
  holidays.push(canadaDay);
  
  // Civic Holiday (1st Monday in August) - most provinces
  const civicHoliday = new Date(year, 7, 1);
  const firstMondayAug = civicHoliday.getDay() === 1 ? civicHoliday : new Date(year, 7, 8 - civicHoliday.getDay());
  holidays.push(firstMondayAug);
  
  // Labour Day (1st Monday in September)
  const labourDay = new Date(year, 8, 1);
  const firstMondaySep = labourDay.getDay() === 1 ? labourDay : new Date(year, 8, 8 - labourDay.getDay());
  holidays.push(firstMondaySep);
  
  // Thanksgiving (2nd Monday in October)
  const thanksgiving = new Date(year, 9, 1);
  const firstMondayOct = thanksgiving.getDay() === 1 ? thanksgiving : new Date(year, 9, 8 - thanksgiving.getDay());
  holidays.push(new Date(firstMondayOct.getTime() + 7 * 24 * 60 * 60 * 1000));
  
  // Remembrance Day - November 11
  holidays.push(new Date(year, 10, 11));
  
  // Christmas Day - December 25
  let christmas = new Date(year, 11, 25);
  if (christmas.getDay() === 0) { // If Sunday, observed on Monday
    christmas = new Date(year, 11, 26);
  }
  holidays.push(christmas);
  
  // Boxing Day - December 26
  let boxingDay = new Date(year, 11, 26);
  if (boxingDay.getDay() === 0) { // If Sunday, observed on Monday
    boxingDay = new Date(year, 11, 27);
  } else if (boxingDay.getDay() === 6) { // If Saturday, observed on Monday
    boxingDay = new Date(year, 11, 28);
  }
  holidays.push(boxingDay);
  
  return holidays;
}

function calculateEaster(year: number): Date {
  // Algorithm to calculate Easter Sunday
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

export function isCanadianHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getCanadianHolidays(year);
  
  return holidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
}
