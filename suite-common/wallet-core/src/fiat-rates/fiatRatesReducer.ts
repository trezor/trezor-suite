import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker, isTestnet } from '@suite-common/wallet-utils';

import { updateFiatRatesThunk, updateTxsFiatRatesThunk } from './fiatRatesThunks';
import { FiatRatesState } from './fiatRatesTypes';

export const fiatRatesInitialState: FiatRatesState = {
    current: {},
    lastWeek: {},
    historic: {},
};

export const prepareFiatRatesReducer = createReducerWithExtraDeps(
    fiatRatesInitialState,
    (builder, extra) => {
        builder
            .addCase(updateFiatRatesThunk.pending, (state, action) => {
                const { ticker, localCurrency, rateType } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);
                let currentRate = state[rateType]?.[fiatRateKey];

                if (isTestnet(ticker.symbol)) {
                    return;
                }

                if (currentRate) {
                    currentRate = {
                        ...currentRate,
                        isLoading: true,
                        error: null,
                    };
                } else {
                    currentRate = {
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        lastTickerTimestamp: 0 as Timestamp,
                        isLoading: true,
                        error: null,
                        ticker,
                    };
                }
                state[rateType][fiatRateKey] = currentRate;
            })
            .addCase(updateFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                const { ticker, localCurrency, rateType, fetchAttemptTimestamp } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);

                const currentRate = state[rateType]?.[fiatRateKey];

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) {
                    return;
                }

                state[rateType][fiatRateKey] = {
                    ...currentRate,
                    rate: action.payload.rate,
                    lastTickerTimestamp: (action.payload.lastTickerTimestamp * 1000) as Timestamp,
                    lastSuccessfulFetchTimestamp: fetchAttemptTimestamp,
                    isLoading: false,
                    error: null,
                };
            })
            .addCase(updateFiatRatesThunk.rejected, (state, action) => {
                const { ticker, localCurrency, rateType } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, localCurrency);
                const currentRate = state[rateType]?.[fiatRateKey];

                if (isTestnet(ticker.symbol)) {
                    return;
                }

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) {
                    return;
                }

                state[rateType][fiatRateKey] = {
                    ...currentRate,
                    isLoading: false,
                    error: action.error.message || `Failed to update ${ticker.symbol} fiat rate.`,
                };
            })
            .addCase(updateTxsFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                action.payload.rates.forEach(fiatRate => {
                    const { tickerId, rates } = fiatRate;
                    const { localCurrency } = action.meta.arg;
                    const fiatRateKey = getFiatRateKeyFromTicker(tickerId, localCurrency);

                    // combine new rates with existing historic rates
                    state['historic'][fiatRateKey] = {
                        ...state['historic'][fiatRateKey],
                        ...rates.reduce(
                            (acc, rate) => ({ ...acc, [rate.lastTickerTimestamp]: rate.rate }),
                            {},
                        ),
                    };
                });
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadHistoricRates,
            );
    },
);
