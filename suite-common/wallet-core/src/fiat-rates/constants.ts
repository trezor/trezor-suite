import { RateType } from 'suite-common/wallet-types';

export const actionPrefix = '@common/wallet-core/fiat-rates';

export const MAX_AGE = {
    current: 1000 * 60 * 10, // 10 mins
    lastWeek: 1000 * 60 * 60 * 1, // 1 hour
} satisfies Record<RateType, number>;

export const REFETCH_INTERVAL = {
    current: 1000 * 60 * 2, // 2 mins
    lastWeek: 1000 * 60 * 60 * 1, // 1 hour
} satisfies Record<RateType, number>;
