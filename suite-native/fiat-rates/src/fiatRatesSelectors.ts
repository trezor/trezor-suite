import { pipe, A, F, D } from '@mobily/ts-belt';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { AccountKey, Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { memoize, memoizeWithArgs } from 'proxy-memoize';
import {
    selectTransactions,
    AccountsRootState,
    selectAccountByKey,
    selectAccounts,
    FiatRatesState as FiatRatesStateLegacy,
} from '@suite-common/wallet-core';
import { MAX_AGE } from './fiatRatesConst';
import { FiatRatesRootState, getFiatRateKeyFromTicker, Rate, RateType } from './fiatRatesReducer';
import { FiatRateKey, TickerId } from './types';

export const selectFiatRatesByFiatRateKey = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    rateType: RateType = 'current',
): Rate | undefined => state.wallet.fiat?.[rateType]?.[fiatRateKey];

export const selectIsFiatRateLoading = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    rateType: RateType = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);
    return currentRate?.isLoading ?? false;
};

export const selectIsTickerLoading = (
    state: FiatRatesRootState,
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
    return selectIsFiatRateLoading(state, fiatRateKey);
};

export const selectShouldUpdateFiatRate = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    rateType: RateType = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    if (!currentRate) {
        return true;
    }

    const { lastSuccessfulFetchTimestamp } = currentRate;
    const now = Date.now();

    return now - lastSuccessfulFetchTimestamp > MAX_AGE[rateType];
};

export const selectShouldUpdateTicker = (
    state: FiatRatesRootState,
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
    return selectShouldUpdateFiatRate(state, fiatRateKey);
};

export const selectTickersToBeUpdated = (
    state: FiatRatesRootState,
    fiatCurrency: FiatCurrencyCode,
    rateType: RateType,
): TickerId[] => {
    const tickers = selectTickerFromAccounts(state);
    console.log('tickers', tickers);
    return tickers.filter(ticker => {
        const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
        return (
            selectShouldUpdateFiatRate(state, fiatRateKey, rateType) &&
            !selectIsTickerLoading(state, ticker, fiatCurrency)
        );
    });
};

export const selectIsAccountWithRatesByKey = memoizeWithArgs(
    (state: AccountsRootState & FiatRatesRootState, accountKey: string) => {
        const account = selectAccountByKey(state, accountKey);

        if (!account) {
            return false;
        }

        const rates = selectCoinsLegacy(state);

        return !!rates.find(rate => rate.symbol === account.symbol);
    },
);

export const selectTickerFromAccounts = (state: FiatRatesRootState): TickerId[] => {
    const accounts = selectAccounts(state as any);
    return pipe(
        accounts,
        A.map(account => [
            {
                symbol: account.symbol,
            } as TickerId,
            ...(account.tokens || []).map(
                token =>
                    ({
                        symbol: token.symbol,
                        mainNetworkSymbol: account.symbol,
                        tokenAddress: token.address,
                    } as TickerId),
            ),
        ]),
        A.flat,
        F.toMutable,
    );
};

export const selectTransactionsWithMissingRates = memoizeWithArgs(
    (state: FiatRatesRootState, localCurrency: FiatCurrencyCode) => {
        const accountTransactions = selectTransactions(state);

        return pipe(
            accountTransactions,
            D.mapWithKey((accountKey, txs) => ({
                account: selectAccountByKey(state, accountKey as AccountKey),
                txs: txs.filter(tx => !tx.rates?.[localCurrency]),
            })),
            D.filter(({ account, txs }) => !account || !txs.length),
            D.values,
            A.filter(value => !!value),
        ) as {
            account: Account;
            txs: WalletAccountTransaction[];
        }[];
    },
    { size: 1 },
);

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * @deprecated Use selectFiatRatesByFiatRateKey or any other selector
 */
export const selectCoinsLegacy = memoize(
    (state: FiatRatesRootState): FiatRatesStateLegacy['coins'] => {
        const coins: FiatRatesStateLegacy['coins'] = [];

        Object.values(state.wallet.fiat.current).forEach(rate => {
            const coin = coins.find(c => c.symbol === rate.ticker.symbol);
            if (coin && coin.current) {
                coin.current.rates[rate.locale] = rate.rate;
            } else {
                coins.push({
                    ...rate.ticker,
                    current: {
                        rates: {
                            [rate.locale]: rate.rate,
                        },
                        ...rate.ticker,
                        ts: rate.lastSuccessfulFetchTimestamp,
                    },
                });
            }
        });

        Object.values(state.wallet.fiat.lastWeek).forEach(rate => {
            const coin = coins.find(c => c.symbol === rate.ticker.symbol);
            if (coin) {
                const ticker = coin.lastWeek?.tickers.find(
                    t => t.ts === rate.lastSuccessfulFetchTimestamp,
                );
                if (ticker) {
                    ticker.rates[rate.locale] = rate.rate;
                } else {
                    coin.lastWeek?.tickers.push({
                        rates: {
                            [rate.locale]: rate.rate,
                        },
                        ts: rate.lastSuccessfulFetchTimestamp,
                    });
                }
            } else {
                coins.push({
                    ...rate.ticker,
                    lastWeek: {
                        tickers: [
                            {
                                rates: {
                                    [rate.locale]: rate.rate,
                                },
                                ts: rate.lastSuccessfulFetchTimestamp - ONE_WEEK_IN_MS,
                            },
                        ],
                        ts: rate.lastSuccessfulFetchTimestamp,
                        ...rate.ticker,
                    },
                });
            }
        });

        return coins;
    },
    {
        size: 400,
    },
);
