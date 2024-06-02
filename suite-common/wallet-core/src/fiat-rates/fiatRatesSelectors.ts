import { A, D, F, pipe } from '@mobily/ts-belt';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    Account,
    AccountKey,
    WalletAccountTransaction,
    FiatRateKey,
    Rate,
    TickerId,
    RateTypeWithoutHistoric,
    Timestamp,
    TokenAddress,
    RatesByKey,
    RatesByTimestamps,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    getFiatRateKeyFromTicker,
    isNftTokenTransfer,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';

import {
    AccountsRootState,
    selectAccountByKey,
    selectDeviceAccounts,
} from '../accounts/accountsReducer';
import { TransactionsRootState, selectTransactions } from '../transactions/transactionsReducer';
import { MAX_AGE } from './fiatRatesConstants';
import { FiatRatesRootState } from './fiatRatesTypes';

type UnixTimestamp = number;

export const selectCurrentFiatRates = (state: FiatRatesRootState): RatesByKey | undefined =>
    state.wallet.fiat?.['current'];

export const selectHistoricFiatRates = (state: FiatRatesRootState): RatesByTimestamps | undefined =>
    state.wallet.fiat?.['historic'];

export const selectFiatRatesByFiatRateKey = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    rateType: RateTypeWithoutHistoric = 'current',
): Rate | undefined => state.wallet.fiat?.[rateType]?.[fiatRateKey];

export const selectHistoricFiatRatesByTimestamp = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    timestamp: Timestamp,
): number | undefined => {
    const roundedTimestamp = roundTimestampToNearestPastHour(timestamp);

    return state.wallet.fiat?.['historic']?.[fiatRateKey]?.[roundedTimestamp];
};

export const selectIsFiatRateLoading = (
    state: FiatRatesRootState,
    fiatRateKey: FiatRateKey,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    return currentRate?.isLoading ?? false;
};

export const selectIsTickerLoading = (
    state: FiatRatesRootState,
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

    return selectIsFiatRateLoading(state, fiatRateKey, rateType);
};

export const selectShouldUpdateFiatRate = (
    state: FiatRatesRootState,
    currentTimestamp: UnixTimestamp,
    fiatRateKey: FiatRateKey,
    rateType: RateTypeWithoutHistoric = 'current',
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
    rateType: RateTypeWithoutHistoric,
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
    const historicFiatRates = selectHistoricFiatRates(state);

    return pipe(
        accountTransactions,
        D.mapWithKey((accountKey, txs) => ({
            account: selectAccountByKey(state, accountKey as AccountKey),
            txs: txs.filter(tx => {
                const fiatRateKey = getFiatRateKey(tx.symbol, localCurrency as FiatCurrencyCode);
                const roundedTimestamp = roundTimestampToNearestPastHour(tx.blockTime as Timestamp);
                const historicRate = historicFiatRates?.[fiatRateKey]?.[roundedTimestamp];

                const isMissingTokenRate = tx.tokens
                    .filter(token => !isNftTokenTransfer(token))
                    .some(token => {
                        const tokenFiatRateKey = getFiatRateKey(
                            tx.symbol,
                            localCurrency,
                            token.contract as TokenAddress,
                        );
                        const historicTokenRate =
                            historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                        return historicTokenRate === undefined || historicTokenRate === 0;
                    });

                return historicRate === undefined || historicRate === 0 || isMissingTokenRate;
            }),
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
