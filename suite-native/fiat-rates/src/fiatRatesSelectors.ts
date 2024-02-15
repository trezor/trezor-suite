import { A, D, F, pipe } from '@mobily/ts-belt';
import { memoize, memoizeWithArgs } from 'proxy-memoize';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    selectAccountByKey,
    selectDeviceAccounts,
    selectTransactions,
} from '@suite-common/wallet-core';
import { Account, AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';

import { MAX_AGE } from './fiatRatesConst';
import { FiatRateKey, FiatRatesRootState, Rate, RateType, TickerId } from './types';
import { getFiatRateKeyFromTicker } from './utils';

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

export const selectTickerFromAccounts = memoize((state: FiatRatesRootState): TickerId[] => {
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
});

export const selectTickersToBeUpdated = memoizeWithArgs(
    (state: FiatRatesRootState, fiatCurrency: FiatCurrencyCode, rateType: RateType): TickerId[] => {
        const tickers = selectTickerFromAccounts(state);

        return tickers.filter(ticker => {
            const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

            return (
                selectShouldUpdateFiatRate(state, fiatRateKey, rateType) &&
                !selectIsTickerLoading(state, ticker, fiatCurrency)
            );
        });
    },
    // used 5 just to be safe, but there shouldn't be more than one local currency at 2 rate types at one time
    { size: 5 },
);

export const selectTransactionsWithMissingRates = memoizeWithArgs(
    (state: FiatRatesRootState, localCurrency: FiatCurrencyCode) => {
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
    },
    // There could be only one active local currency at the time
    { size: 1 },
);
