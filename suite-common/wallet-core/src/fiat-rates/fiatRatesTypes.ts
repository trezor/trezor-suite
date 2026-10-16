import { type RatesByTimestamps } from '@suite-common/wallet-types';

import { type FiatRatesApiRootState } from './fiatRatesApi';

export type FiatRatesState = {
    historic: RatesByTimestamps;
};

export type FiatRatesHistoricRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
};

export type FiatRatesRootState = FiatRatesApiRootState & FiatRatesHistoricRootState;
