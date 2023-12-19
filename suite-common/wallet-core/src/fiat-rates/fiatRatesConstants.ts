import { RateType } from 'suite-common/wallet-types';

export const fiatRatesActionsPrefix = '@common/wallet-core/fiat-rates';

const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_HOUR_IN_MS = 60 * ONE_MINUTE_IN_MS;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
export const ONE_WEEK_IN_MS = 7 * ONE_DAY_IN_MS;

export const MAX_AGE = {
    current: 10 * ONE_MINUTE_IN_MS,
    lastWeek: ONE_HOUR_IN_MS,
} satisfies Record<RateType, number>;

export const REFETCH_INTERVAL = {
    current: 2 * ONE_MINUTE_IN_MS,
    lastWeek: ONE_HOUR_IN_MS,
} satisfies Record<RateType, number>;
