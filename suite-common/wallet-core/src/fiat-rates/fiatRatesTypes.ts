import { RatesByKey, RatesByTimestamps } from '@suite-common/wallet-types';

export type FiatRatesState = {
    current: RatesByKey;
    lastWeek: RatesByKey;
    historic: RatesByTimestamps;
};

export type FiatRatesRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
};
