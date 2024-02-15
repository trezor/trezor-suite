import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { updateFiatRatesThunk } from './fiatRatesThunks';
import { FiatRatesState, Timestamp } from './types';
import { getFiatRateKeyFromTicker } from './utils';

export const fiatRatesInitialState: FiatRatesState = {
    current: {},
    lastWeek: {},
};

export const prepareFiatRatesReducer = createReducerWithExtraDeps(
    fiatRatesInitialState,
    builder => {
        builder
            .addCase(updateFiatRatesThunk.pending, (state, action) => {
                const { ticker, localCurrency, rateType = 'current' } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);
                let currentRate = state[rateType]?.[fiatRateKey];

                if (currentRate) {
                    currentRate = {
                        ...currentRate,
                        isLoading: true,
                        error: null,
                    };
                } else {
                    currentRate = {
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        isLoading: true,
                        error: null,
                        ticker,
                    };
                }
                state[rateType][fiatRateKey] = currentRate;
            })
            .addCase(updateFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                const { ticker, localCurrency, rateType = 'current' } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);

                const currentRate = state[rateType]?.[fiatRateKey];

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) return;

                state[rateType][fiatRateKey] = {
                    ...currentRate,
                    rate: action.payload,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    isLoading: false,
                    error: null,
                };
            })
            .addCase(updateFiatRatesThunk.rejected, (state, action) => {
                const { ticker, localCurrency, rateType = 'current' } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);
                const currentRate = state[rateType]?.[fiatRateKey];

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) return;

                state[rateType][fiatRateKey] = {
                    ...currentRate,
                    isLoading: false,
                    error: action.error.message || `Failed to update ${ticker.symbol} fiat rate.`,
                };
            });
    },
);
