import { RateType } from 'suite-common/wallet-types';

export const actionPrefix = '@common/wallet-core/fiat-rates';

export const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const ONE_HOUR_IN_MS = 1 * 60 * 60 * 1000;

const ONE_MINUTE_IN_MS = 60 * 1000;

export const MAX_AGE = {
    current: 10 * ONE_MINUTE_IN_MS,
    lastWeek: ONE_HOUR_IN_MS,
} satisfies Record<RateType, number>;

export const REFETCH_INTERVAL = {
    current: 2 * ONE_MINUTE_IN_MS,
    lastWeek: ONE_HOUR_IN_MS,
} satisfies Record<RateType, number>;
