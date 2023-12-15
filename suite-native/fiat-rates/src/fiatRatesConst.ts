import { RateType } from './types';

export const MAX_AGE = {
    current: 1000 * 60 * 15, // 15 mins
    lastWeek: 1000 * 60 * 60 * 1, // 1 hour
} satisfies Record<RateType, number>;

export const REFETCH_INTERVAL = {
    current: 1000 * 60 * 5, // 5 mins
    lastWeek: 1000 * 60 * 60 * 1, // 1 hour
} satisfies Record<RateType, number>;

export const actionPrefix = '@native/fiat-rates';
