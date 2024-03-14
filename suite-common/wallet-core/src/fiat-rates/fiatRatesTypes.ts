import { FiatRateKey, Rate, Timestamp } from '@suite-common/wallet-types';

type RatesByKey = Record<FiatRateKey, Rate>;
type RatesByTimestamps = Record<FiatRateKey, Record<Timestamp, number>>;

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
