import type { NetworkSymbol } from '@suite-common/networks';
import { type RatesByKey, type RatesByTimestamps } from '@suite-common/wallet-types';

export type FiatRatesState = {
    testnetSymbols?: NetworkSymbol[];
    current: RatesByKey;
    lastWeek: RatesByKey;
    historic: RatesByTimestamps;
};

export type FiatRatesRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
};
