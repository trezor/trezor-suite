const DAY_MS = 24 * 60 * 60 * 1000;

export const getDaysUntil = (date: string) =>
    Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS));

export type FormatAmountFunction = (amount: number) => string;
export const createFormatAmount = (currency: string): FormatAmountFunction =>
    Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format;
