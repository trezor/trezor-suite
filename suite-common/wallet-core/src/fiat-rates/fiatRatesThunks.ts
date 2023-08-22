import { getUnixTime, subWeeks } from 'date-fns';

import {
    getFiatRatesForTimestamps,
    fetchCurrentFiatRates,
    fetchLastWeekFiatRates,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { Account, TickerId, RateType, Timestamp } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import TrezorConnect, { AccountTransaction } from '@trezor/connect';
import { networks } from '@suite-common/wallet-config';

import { fiatRatesActionsPrefix, REFETCH_INTERVAL } from './constants';
import { selectTickersToBeUpdated, selectTransactionsWithMissingRates } from './fiatRatesSelectors';
import { transactionsActions } from '../transactions/transactionsActions';

type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: AccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

// This code is not refactored yet, basically it's a copy of the original code from @suite-common
// TODO: Refactor this to batch requests as much as possible and also fetch rates only for currencies that are actually used
export const updateTxsFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateTxsRates`,
    async ({ account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload, { dispatch }) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return;

        const timestamps = txs.map(tx => tx.blockTime!);
        const response = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
            coin: account.symbol,
            timestamps,
            currencies: [localCurrency],
        });
        try {
            const results = response.success
                ? response.payload
                : await getFiatRatesForTimestamps(
                      { symbol: account.symbol },
                      timestamps,
                      localCurrency,
                  );

            if (results && 'tickers' in results) {
                dispatch(
                    transactionsActions.updateTransactionFiatRate(
                        txs.map((tx, i) => ({
                            txid: tx.txid,
                            updateObject: { rates: results.tickers[i]?.rates },
                            account,
                            ts: Date.now(),
                        })),
                    ),
                );
            }
        } catch (error) {
            console.error(error);
        }
    },
);

const fetchFiatRate = async (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): Promise<number | undefined | null> => {
    const { symbol, tokenAddress } = ticker;

    if (networks[symbol].testnet) return null;

    const { success, payload } = await TrezorConnect.blockchainGetCurrentFiatRates({
        coin: symbol,
        token: tokenAddress,
        currencies: [fiatCurrency],
    });

    const rate = success ? payload.rates?.[fiatCurrency] : null;
    if (rate) return rate;

    if (tokenAddress && !rate) {
        // We don't want to fallback to coingecko for tokens because it returns nonsenses
        return null;
    }

    return fetchCurrentFiatRates(ticker).then(res => res?.rates?.[fiatCurrency]);
};

const fetchLastWeekRate = async (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): Promise<number | undefined | null> => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
    const timestamps = [weekAgoTimestamp];
    const { symbol, tokenAddress } = ticker;

    if (networks[symbol].testnet) return null;

    const { success, payload } = await TrezorConnect.blockchainGetFiatRatesForTimestamps({
        coin: symbol,
        token: tokenAddress,
        timestamps,
        currencies: [fiatCurrency],
    });

    const rate = success ? payload.tickers?.[0]?.rates?.[fiatCurrency] : null;
    if (rate) return rate;

    if (tokenAddress && !rate) {
        // We don't want to fallback to coingecko for tokens because it returns nonsenses
        return null;
    }

    return fetchLastWeekFiatRates(ticker, fiatCurrency).then(
        res => res?.tickers?.[0]?.rates?.[fiatCurrency],
    );
};

const fetchFn: Record<RateType, typeof fetchFiatRate> = {
    current: fetchFiatRate,
    lastWeek: fetchLastWeekRate,
};

type UpdateCurrentFiatRatesThunkPayload = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    lastSuccessfulFetchTimestamp: Timestamp;
    rateType: RateType;
};

export const updateFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateFiatRates`,
    async ({ ticker, localCurrency, rateType }: UpdateCurrentFiatRatesThunkPayload) => {
        const rate = await fetchFn[rateType](ticker, localCurrency);

        if (!rate) {
            throw new Error('Failed to fetch fiat rates');
        }

        return rate;
    },
);

export const updateMissingTxFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateMissingTxRates`,
    ({ localCurrency }: { localCurrency: FiatCurrencyCode }, { dispatch, getState }) => {
        const transactionsWithMissingRates = selectTransactionsWithMissingRates(
            getState(),
            localCurrency,
        );

        transactionsWithMissingRates.forEach(({ account, txs }) => {
            dispatch(updateTxsFiatRatesThunk({ account, txs, localCurrency }));
        });
    },
);

type FetchFiatRatesThunkPayload = {
    rateType: RateType;
    localCurrency: FiatCurrencyCode;
};

export const fetchFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/fetchFiatRates`,
    ({ rateType, localCurrency }: FetchFiatRatesThunkPayload, { dispatch, getState }) => {
        const tickers = selectTickersToBeUpdated(getState(), localCurrency, rateType);

        return Promise.allSettled(
            tickers.map(ticker =>
                dispatch(
                    updateFiatRatesThunk({
                        ticker,
                        localCurrency,
                        rateType,
                        lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                    }),
                ),
            ),
        );
    },
);

const ratesTimeouts: Record<RateType, ReturnType<typeof setTimeout> | null> = {
    current: null,
    lastWeek: null,
};

type PeriodicFetchFiatRatesThunkPayload = {
    rateType: RateType;
    localCurrency: FiatCurrencyCode;
};

export const periodicFetchFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/periodicFetchFiatRates`,
    async ({ rateType, localCurrency }: PeriodicFetchFiatRatesThunkPayload, { dispatch }) => {
        if (ratesTimeouts[rateType]) {
            clearTimeout(ratesTimeouts[rateType]!);
        }
        await dispatch(fetchFiatRatesThunk({ rateType, localCurrency }));
        ratesTimeouts[rateType] = setTimeout(() => {
            dispatch(periodicFetchFiatRatesThunk({ rateType, localCurrency }));
        }, REFETCH_INTERVAL[rateType]);
    },
);
