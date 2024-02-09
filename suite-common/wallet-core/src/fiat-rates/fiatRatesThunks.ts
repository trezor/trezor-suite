import {
    getFiatRatesForTimestamps,
    fetchCurrentFiatRates,
    fetchLastWeekFiatRates,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { Account, TickerId, RateType, Timestamp } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { AccountTransaction } from '@trezor/connect';
import { getNetworkFeatures, networks } from '@suite-common/wallet-config';

import { fiatRatesActionsPrefix, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated, selectTransactionsWithMissingRates } from './fiatRatesSelectors';
import { transactionsActions } from '../transactions/transactionsActions';
import { selectSpecificTokenDefinition } from '../token-definitions/tokenDefinitionsSelectors';

type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: AccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

export const updateTxsFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateTxsRates`,
    async ({ account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload, { dispatch }) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return;

        const timestamps = txs.map(tx => tx.blockTime!);

        try {
            const results = await getFiatRatesForTimestamps(
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

const fetchFiatRate = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): Promise<number | undefined | null> => {
    const { symbol } = ticker;

    if (networks[symbol].testnet) return Promise.resolve(null);

    return fetchCurrentFiatRates(ticker, fiatCurrency);
};

const fetchLastWeekRate = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): Promise<number | undefined | null> => {
    if (networks[ticker.symbol].testnet) return Promise.resolve(null);

    return fetchLastWeekFiatRates(ticker, fiatCurrency);
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
    forceFetchToken?: boolean;
};

export const updateFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateFiatRates`,
    async (
        { ticker, localCurrency, rateType, forceFetchToken }: UpdateCurrentFiatRatesThunkPayload,
        { getState },
    ) => {
        const networkFeatures = getNetworkFeatures(ticker.symbol);
        if (
            ticker.tokenAddress &&
            networkFeatures.includes('token-definitions') &&
            !forceFetchToken
        ) {
            const tokenDefinition = selectSpecificTokenDefinition(
                getState(),
                ticker.symbol,
                ticker.tokenAddress,
            );

            if (!tokenDefinition?.isTokenKnown) {
                return;
            }
        }

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
        const currentTimestamp = Date.now();
        const tickers = selectTickersToBeUpdated(
            getState(),
            currentTimestamp,
            localCurrency,
            rateType,
        );

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
