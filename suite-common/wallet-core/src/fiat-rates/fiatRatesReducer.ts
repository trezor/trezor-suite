import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker, isTestnet } from '@suite-common/wallet-utils';

import { updateFiatRatesThunk, updateTxsFiatRatesThunk } from './fiatRatesThunks';
import { type FiatRatesState } from './fiatRatesTypes';

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
                const { tickers, baseCurrencyCode, rateType } = action.meta.arg;
                tickers.forEach(ticker => {
                    const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);
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
                });
            })
            .addCase(updateFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                const { tickers, baseCurrencyCode, rateType, fetchAttemptTimestamp } =
                    action.meta.arg;

                // action.payload is iterator so we need for loop (nothing else works in Hermes (React Native))
                let index = -1;
                for (const result of action.payload) {
                    index++;

                    const ticker = tickers[index];
                    if (!ticker) {
                        continue;
                    }

                    if (isTestnet(ticker.symbol)) {
                        continue;
                    }

                    if (result.status === 'rejected') {
                        const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);
                        const currentRate = state[rateType]?.[fiatRateKey];

                        // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                        if (!currentRate) {
                            continue;
                        }

                        state[rateType][fiatRateKey] = {
                            ...currentRate,
                            isLoading: false,
                            error:
                                String(result.reason) ||
                                `Failed to update ${ticker.symbol} fiat rate.`,
                        };

                        continue;
                    }

                    const rate = result.value;
                    const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);

                    const currentRate = state[rateType]?.[fiatRateKey];

                    // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                    if (!currentRate) {
                        continue;
                    }
                    state[rateType][fiatRateKey] = {
                        ...currentRate,
                        rate: rate.rate,
                        lastTickerTimestamp: (rate.lastTickerTimestamp * 1000) as Timestamp,
                        lastSuccessfulFetchTimestamp: fetchAttemptTimestamp,
                        isLoading: false,
                        error: null,
                    };
                }
            })
            .addCase(updateFiatRatesThunk.rejected, (state, action) => {
                // This case should ideally never happen, but in case something will seriously go wrong
                // we want to have some error message in the state.
                const { tickers, baseCurrencyCode, rateType } = action.meta.arg;

                const errorMessage = `${action.error?.message}\n${action.error?.stack}`;

                tickers.forEach(ticker => {
                    const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);
                    const currentRate = state[rateType]?.[fiatRateKey];
                    if (currentRate) {
                        currentRate.error = errorMessage;
                        currentRate.isLoading = false;
                    }
                });
            })
            .addCase(updateTxsFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                action.payload.rates.forEach(fiatRate => {
                    const { tickerId, rates } = fiatRate;
                    const { baseCurrencyCode } = action.meta.arg;
                    const fiatRateKey = getFiatRateKeyFromTicker(tickerId, baseCurrencyCode);

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
