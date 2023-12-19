// This file is almost a duplicate with suite-native fiatRatesSelectors
// There are some small differences such as removed memoization

import { A, D, F, pipe } from '@mobily/ts-belt';
import { memoize } from 'proxy-memoize';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    Account,
    AccountKey,
    WalletAccountTransaction,
    FiatRateKey,
    FiatRatesStateLegacy,
    Rate,
    RateType,
    TickerId,
} from '@suite-common/wallet-types';
import { getFiatRateKeyFromTicker } from '@suite-common/wallet-utils';

import {
    AccountsRootState,
    selectAccountByKey,
    selectDeviceAccounts,
} from '../accounts/accountsReducer';
import { TransactionsRootState, selectTransactions } from '../transactions/transactionsReducer';
import { MAX_AGE, ONE_WEEK_IN_MS } from './fiatRatesConstants';
import { FiatRatesRootState } from './fiatRatesTypes';

type UnixTimestamp = number;

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
    rateType: RateType = 'current',
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
    return selectIsFiatRateLoading(state, fiatRateKey, rateType);
};

export const selectShouldUpdateFiatRate = (
    state: FiatRatesRootState,
    currentTimestamp: UnixTimestamp,
    fiatRateKey: FiatRateKey,
    rateType: RateType = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    if (!currentRate) {
        return true;
    }

    const { lastSuccessfulFetchTimestamp } = currentRate;

    return currentTimestamp - lastSuccessfulFetchTimestamp > MAX_AGE[rateType];
};

export const selectTickerFromAccounts = (state: FiatRatesRootState): TickerId[] => {
    const accounts = selectDeviceAccounts(state as any);
    return pipe(
        accounts,
        A.map(account => [
            {
                symbol: account.symbol,
            } as TickerId,
            ...(account.tokens || []).map(
                token =>
                    ({
                        symbol: account.symbol,
                        tokenAddress: token.contract,
                    }) as TickerId,
            ),
        ]),
        A.flat,
        F.toMutable,
    );
};

export const selectTickersToBeUpdated = (
    state: FiatRatesRootState,
    currentTimestamp: UnixTimestamp,
    fiatCurrency: FiatCurrencyCode,
    rateType: RateType,
): TickerId[] => {
    const tickers = selectTickerFromAccounts(state);

    return tickers.filter(ticker => {
        const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);
        return (
            selectShouldUpdateFiatRate(state, currentTimestamp, fiatRateKey, rateType) &&
            !selectIsTickerLoading(state, ticker, fiatCurrency, rateType)
        );
    });
};

export const selectTransactionsWithMissingRates = (
    state: FiatRatesRootState & TransactionsRootState & AccountsRootState,
    localCurrency: FiatCurrencyCode,
) => {
    const accountTransactions = selectTransactions(state);

    return pipe(
        accountTransactions,
        D.mapWithKey((accountKey, txs) => ({
            account: selectAccountByKey(state, accountKey as AccountKey),
            txs: txs.filter(tx => !tx.rates?.[localCurrency]),
        })),
        D.filter(({ account, txs }) => !!account && !!txs.length),
        D.values,
        A.filter(value => !!value),
    ) as {
        account: Account;
        txs: WalletAccountTransaction[];
    }[];
};

/**
 * @deprecated Use selectFiatRatesByFiatRateKey or any other selector
 */
export const selectCoinsLegacy = memoize(
    (state: FiatRatesRootState): FiatRatesStateLegacy['coins'] => {
        const coins: FiatRatesStateLegacy['coins'] = [];

        Object.values(state.wallet.fiat.current).forEach(rate => {
            const coin = coins.find(
                c => c.symbol === rate.ticker.symbol && c.tokenAddress === rate.ticker.tokenAddress,
            );
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
            const coin = coins.find(
                c => c.symbol === rate.ticker.symbol && c.tokenAddress === rate.ticker.tokenAddress,
            );
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
);

export const selectIsAccountWithRatesByKey = (
    state: AccountsRootState & FiatRatesRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return false;
    }

    // TODO: refactor
    const rates = selectCoinsLegacy(state);

    return !!rates.find(rate => rate.symbol === account.symbol);
};
