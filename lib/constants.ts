export const COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#f97316',
];

export const START_HOUR  = 5;   // 5 am
export const END_HOUR    = 23;  // 11 pm
export const HOURS       = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
export const PX_PER_HOUR = 64;
export const PX_PER_MIN  = PX_PER_HOUR / 60;
export const LABEL_W     = 52;
