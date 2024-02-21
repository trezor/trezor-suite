// This file is almost a duplicate with suite-native fiatRatesSelectors
// There are some small differences such as removed memoization

import { A, D, F, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    Account,
    AccountKey,
    WalletAccountTransaction,
    FiatRateKey,
    Rate,
    RateType,
    TickerId,
    FiatRates,
} from '@suite-common/wallet-types';
import { getFiatRateKey, getFiatRateKeyFromTicker } from '@suite-common/wallet-utils';

import {
    AccountsRootState,
    selectAccountByKey,
    selectDeviceAccounts,
} from '../accounts/accountsReducer';
import { TransactionsRootState, selectTransactions } from '../transactions/transactionsReducer';
import { MAX_AGE } from './fiatRatesConstants';
import { FiatRatesRootState } from './fiatRatesTypes';

type UnixTimestamp = number;

export const selectFiatRates = (
    state: FiatRatesRootState,
    rateType: RateType = 'current',
): FiatRates | undefined => state.wallet.fiat?.[rateType];

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

export const selectIsAccountWithRatesByKey = (
    state: AccountsRootState & FiatRatesRootState,
    accountKey: string,
    fiatCurrency: FiatCurrencyCode,
) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return false;
    }

    const fiatRateKey = getFiatRateKey(account.symbol, fiatCurrency);
    const rates = selectFiatRatesByFiatRateKey(state, fiatRateKey);

    return !!rates;
};
