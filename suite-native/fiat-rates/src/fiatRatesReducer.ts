import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, TransactionsRootState } from '@suite-common/wallet-core';
import { TokenSymbol, TokenAddress } from '@suite-common/wallet-types';

import { updateFiatRatesThunk } from './fiatRatesThunks';
import { FiatRateKey, TickerId } from './types';

export const getFiatRateKey = (
    symbol: TokenSymbol | NetworkSymbol,
    fiatCurrency: FiatCurrencyCode,
    tokenAddress?: TokenAddress,
): FiatRateKey => {
    if (tokenAddress) {
        return `${symbol}-${fiatCurrency}-${tokenAddress}` as FiatRateKey;
    }
    return `${symbol}-${fiatCurrency}` as FiatRateKey;
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): FiatRateKey => {
    const { symbol, tokenAddress } = ticker;
    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};

export type Timestamp = number & { __type: 'Timestamp' };

export type RateType = 'current' | 'lastWeek';

export type Rate = {
    rate?: number;

    lastSuccessfulFetchTimestamp: Timestamp;

    isLoading: boolean;
    error: string | null;

    ticker: TickerId;
    // only useful for selectFiatRatesLegacy selector, once we get rid of it, we can remove this
    locale: FiatCurrencyCode;
};

export type FiatRatesState = Record<RateType, Record<FiatRateKey, Rate>>;

export const fiatRatesInitialState: FiatRatesState = {
    current: {},
    lastWeek: {},
};

export type FiatRatesRootState = {
    wallet: {
        fiat: FiatRatesState;
    };
} & AccountsRootState &
    TransactionsRootState;

export const prepareFiatRatesReducer = createReducerWithExtraDeps(
    fiatRatesInitialState,
    (builder, extra) => {
        builder
            .addCase(updateFiatRatesThunk.pending, (state, action) => {
                const { ticker, fiatCurrency, rateType = 'current' } = action.meta.arg;
                const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
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
                        locale: fiatCurrency,
                    };
                }
                state[rateType][fiatRateKey] = currentRate;
            })
            .addCase(updateFiatRatesThunk.fulfilled, (state, action) => {
                if (!action.payload) return;

                const { ticker, fiatCurrency, rateType = 'current' } = action.meta.arg;
                const FiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

                const currentRate = state[rateType]?.[FiatRateKey];

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) return;

                state[rateType][FiatRateKey] = {
                    ...currentRate,
                    rate: action.payload,
                    lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    isLoading: false,
                    error: null,
                };
            })
            .addCase(updateFiatRatesThunk.rejected, (state, action) => {
                const { ticker, fiatCurrency, rateType = 'current' } = action.meta.arg;
                const FiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
                const currentRate = state[rateType]?.[FiatRateKey];

                // To prevent race condition someone will remove rate from state while fetching for example (during currency change etc.)
                if (!currentRate) return;

                state[rateType][FiatRateKey] = {
                    ...currentRate,
                    isLoading: false,
                    error: action.error.message || `Failed to update ${ticker.symbol} fiat rate.`,
                    locale: fiatCurrency,
                };
            })
            // TODO: migration for desktop?
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFiatRates);
    },
);
