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
import { getNetworkFeatures } from '@suite-common/wallet-config';

import { FIAT_RATES_MODULE_PREFIX, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated, selectTransactionsWithMissingRates } from './fiatRatesSelectors';
import { transactionsActions } from '../transactions/transactionsActions';
import { selectIsSpecificCoinDefinitionKnown } from '../token-definitions/tokenDefinitionsSelectors';
import { selectIsElectrumBackendSelected } from '../blockchain/blockchainSelectors';

type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: AccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

// TODO: Refactor this to batch requests as much as possible
export const updateTxsFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateTxsRates`,
    async (
        { account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload,
        { dispatch, getState },
    ) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return;

        const timestamps = txs.map(tx => tx.blockTime!);

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        try {
            const results = await getFiatRatesForTimestamps(
                { symbol: account.symbol },
                timestamps,
                localCurrency,
                isElectrumBackend,
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

const fetchFn: Record<RateType, typeof fetchCurrentFiatRates> = {
    current: fetchCurrentFiatRates,
    lastWeek: fetchLastWeekFiatRates,
};

type UpdateCurrentFiatRatesThunkPayload = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    fetchAttemptTimestamp: Timestamp;
    rateType: RateType;
    forceFetchToken?: boolean;
};

export const updateFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateFiatRates`,
    async (
        { ticker, localCurrency, rateType, forceFetchToken }: UpdateCurrentFiatRatesThunkPayload,
        { getState },
    ) => {
        if (isTestnet(ticker.symbol)) return;

        const hasCoinDefinitions = getNetworkFeatures(ticker.symbol).includes('coin-definitions');
        if (ticker.tokenAddress && hasCoinDefinitions && !forceFetchToken) {
            const isTokenKnown = selectIsSpecificCoinDefinitionKnown(
                getState(),
                ticker.symbol,
                ticker.tokenAddress,
            );

            if (!isTokenKnown) {
                throw new Error('Missing token definition');
            }
        }

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), ticker.symbol);

        const rate = await fetchFn[rateType]({
            ticker,
            localCurrency,
            isElectrumBackend,
        });

        if (!rate) {
            throw new Error('Failed to fetch fiat rates');
        }

        return rate;
    },
);

export const updateMissingTxFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateMissingTxRates`,
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
    `${FIAT_RATES_MODULE_PREFIX}/fetchFiatRates`,
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
                        fetchAttemptTimestamp: Date.now() as Timestamp,
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
    `${FIAT_RATES_MODULE_PREFIX}/periodicFetchFiatRates`,
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
