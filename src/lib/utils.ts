import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utils for formatting
export const formatWeight = (val: number | string) => `${Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`;
export const formatDate = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const formatCurrency = (val: number | string) => `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
