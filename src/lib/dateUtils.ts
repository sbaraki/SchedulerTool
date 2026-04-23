import { format, getDaysInMonth, isValid, parseISO } from 'date-fns';

/**
 * Returns a strictly formatted YYYY-MM-DD string.
 */
export const toISODate = (date: Date): string => {
  if (!isValid(date)) return '2026-01-01';
  return format(date, 'yyyy-MM-dd');
};

/**
 * Projects a calendar date into an exact X-axis pixel position based on zoom (monthWidth)
 */
export const getPositionFromDate = (dateStr: string, monthWidth: number, vMonths: any[]): number => {
  const date = new Date(dateStr + 'T12:00:00');
  if (!isValid(date) || !vMonths || vMonths.length === 0) return 0;
  
  const start = vMonths[0];
  const startAbs = start.year * 12 + start.month;
  const targetAbs = date.getFullYear() * 12 + date.getMonth();
  const monthDiff = targetAbs - startAbs;
  
  const daysInMonth = getDaysInMonth(date);
  return (monthDiff * monthWidth) + ((date.getDate() - 1) / daysInMonth * monthWidth);
};

/**
 * Reverses an X-axis pixel position back into a robust calendar date string
 */
export const getDateFromPosition = (x: number, monthWidth: number, vMonths: any[]): string => {
  if (!vMonths || vMonths.length === 0) return toISODate(new Date());
  
  const totalMonths = x / monthWidth;
  const start = vMonths[0];
  const startAbs = start.year * 12 + start.month;
  
  const targetAbs = startAbs + totalMonths;
  const targetYear = Math.floor(targetAbs / 12);
  const targetMonth = Math.floor(targetAbs % 12);
  const dayFrac = targetAbs - Math.floor(targetAbs);
  
  // Create a base date for the target month to find true days in that month
  const baseMonthDate = new Date(targetYear, targetMonth, 15);
  const daysInMonth = getDaysInMonth(baseMonthDate);
  
  const day = Math.max(1, Math.min(daysInMonth, Math.round(dayFrac * daysInMonth) + 1));
  return toISODate(new Date(targetYear, targetMonth, day));
};

/**
 * Formats date for UI display (e.g., JAN 1, 2026)
 */
export const formatBarDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  if (!isValid(date)) return '---';
  return format(date, 'MMM d, yyyy').toUpperCase();
};
