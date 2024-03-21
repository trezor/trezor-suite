import { createAction } from '@reduxjs/toolkit';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TickerId } from '@suite-common/wallet-types';

export const FIAT_RATES_MODULE_PREFIX = '@common/wallet-core/fiat-rates';

type AddFiatRatesForTimestampsPayload = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    rates: Array<{
        rate?: number;
        timestamp: number;
    }>;
};

const addFiatRatesForTimestamps = createAction(
    `${FIAT_RATES_MODULE_PREFIX}/addFiatRatesForTimestamps`,
    (payload: AddFiatRatesForTimestampsPayload) => ({
        payload,
    }),
);

export const fiatRatesActions = {
    addFiatRatesForTimestamps,
};
