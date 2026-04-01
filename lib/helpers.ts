import { startOfWeek, addDays } from 'date-fns';

let _n = 0;
export const uid   = () => `${++_n}-${Math.random().toString(36).slice(2, 6)}`;
export const pad   = (n: number) => String(n).padStart(2, '0');
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function minsToLabel(m: number) {
  const h    = Math.floor(m / 60) % 24;
  const min  = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh   = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(min)} ${ampm}`;
}

export function formatHour(h: number) {
  if (h === 0)  return '12 AM';
  if (h < 12)  return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function snapToFive(m: number) { return Math.round(m / 5) * 5; }

export function getWeekDays(from: Date): Date[] {
  const monday = startOfWeek(from, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
