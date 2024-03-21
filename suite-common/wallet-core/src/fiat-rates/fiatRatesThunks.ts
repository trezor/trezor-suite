import {
    getFiatRatesForTimestamps,
    fetchCurrentFiatRates,
    fetchLastWeekFiatRates,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    Account,
    TickerId,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
    RateTypeWithoutHistoric,
} from '@suite-common/wallet-types';
import {
    groupTokensTransactionsByContractAddress,
    isTestnet,
    roundTimestampsToNearestPastHour,
} from '@suite-common/wallet-utils';
import { getNetworkFeatures, NetworkSymbol } from '@suite-common/wallet-config';

import { fiatRatesActionsPrefix, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated, selectTransactionsWithMissingRates } from './fiatRatesSelectors';
import { selectIsSpecificCoinDefinitionKnown } from '../token-definitions/tokenDefinitionsSelectors';
import { selectIsElectrumBackendSelected } from '../blockchain/blockchainSelectors';
import { fiatRatesActions } from './fiatRatesActions';

type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: WalletAccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

// TODO: Refactor this to batch requests as much as possible
export const updateTxsFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateTxsRates`,
    async (
        { account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload,
        { dispatch, getState },
    ) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return;

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        try {
            const timestamps = txs.map(tx => tx.blockTime);
            const roundedTimestamps = roundTimestampsToNearestPastHour(timestamps as Timestamp[]);
            const uniqueTimestamps = [...new Set(roundedTimestamps)];

            const results = await getFiatRatesForTimestamps(
                { symbol: account.symbol },
                uniqueTimestamps,
                localCurrency,
                isElectrumBackend,
            );

            if (results && 'tickers' in results) {
                dispatch(
                    fiatRatesActions.addFiatRatesForTimestamps({
                        ticker: { symbol: account.symbol },
                        localCurrency,
                        rates: results.tickers.map((ticker, index) => ({
                            rate: ticker?.rates[localCurrency],
                            timestamp: uniqueTimestamps[index],
                        })),
                    }),
                );
            }
        } catch (error) {
            console.error(error);
        }

        const groupedTokensTxs = groupTokensTransactionsByContractAddress(txs);

        for (const token in groupedTokensTxs) {
            const hasCoinDefinitions = getNetworkFeatures(account.symbol as NetworkSymbol).includes(
                'coin-definitions',
            );
            if (hasCoinDefinitions) {
                const isTokenKnown = selectIsSpecificCoinDefinitionKnown(
                    getState(),
                    account.symbol as NetworkSymbol,
                    token as TokenAddress,
                );

                if (!isTokenKnown) {
                    throw new Error('Missing token definition');
                }
            }

            const timestamps = groupedTokensTxs[token as TokenAddress].map(tx => tx.blockTime!);
            const roundedTimestamps = roundTimestampsToNearestPastHour(timestamps as Timestamp[]);
            const uniqueTimestamps = [...new Set(roundedTimestamps)];

            try {
                const results = await getFiatRatesForTimestamps(
                    {
                        symbol: account.symbol as NetworkSymbol,
                        tokenAddress: token as TokenAddress,
                    },
                    uniqueTimestamps,
                    localCurrency,
                    isElectrumBackend,
                );

                if (results && 'tickers' in results) {
                    dispatch(
                        fiatRatesActions.addFiatRatesForTimestamps({
                            ticker: { symbol: account.symbol, tokenAddress: token as TokenAddress },
                            localCurrency,
                            rates: results.tickers.map((ticker, index) => ({
                                rate: ticker?.rates[localCurrency],
                                timestamp: uniqueTimestamps[index],
                            })),
                        }),
                    );
                }
            } catch (error) {
                console.error(error);
            }
        }
    },
);

const fetchFn: Record<RateTypeWithoutHistoric, typeof fetchCurrentFiatRates> = {
    current: fetchCurrentFiatRates,
    lastWeek: fetchLastWeekFiatRates,
};

type UpdateCurrentFiatRatesThunkPayload = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    lastSuccessfulFetchTimestamp: Timestamp;
    rateType: RateTypeWithoutHistoric;
    forceFetchToken?: boolean;
};

export const updateFiatRatesThunk = createThunk(
    `${fiatRatesActionsPrefix}/updateFiatRates`,
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
    rateType: RateTypeWithoutHistoric;
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

const ratesTimeouts: Record<RateTypeWithoutHistoric, ReturnType<typeof setTimeout> | null> = {
    current: null,
    lastWeek: null,
};

type PeriodicFetchFiatRatesThunkPayload = {
    rateType: RateTypeWithoutHistoric;
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
