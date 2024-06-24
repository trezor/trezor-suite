import { fetchCurrentFiatRates, fetchLastWeekFiatRates } from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    Account,
    TickerId,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
    RateTypeWithoutHistoric,
    TickerResult,
} from '@suite-common/wallet-types';
import {
    fetchTransactionsRates,
    groupTokensTransactionsByContractAddress,
    isTestnet,
} from '@suite-common/wallet-utils';
import { getNetworkFeatures, NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';

import { FIAT_RATES_MODULE_PREFIX, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated, selectTransactionsWithMissingRates } from './fiatRatesSelectors';
import { selectIsElectrumBackendSelected } from '../blockchain/blockchainSelectors';

type UpdateTxsFiatRatesThunkPayload = {
    account: Account;
    txs: WalletAccountTransaction[];
    localCurrency: FiatCurrencyCode;
};

// TODO: Refactor this to batch requests as much as possible
export const updateTxsFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateTxsRates`,
    async ({ account, txs, localCurrency }: UpdateTxsFiatRatesThunkPayload, { getState }) => {
        if (txs?.length === 0 || isTestnet(account.symbol)) return { account, rates: [] };

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        let rates: TickerResult[] = [];

        const timestamps = txs.map(tx => tx.blockTime) as Timestamp[];
        await fetchTransactionsRates(
            { symbol: account.symbol },
            timestamps,
            localCurrency,
            isElectrumBackend,
            rates,
        );

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
                    continue;
                }
            }

            const tokenTimestamps = groupedTokensTxs[token as TokenAddress].map(
                tx => tx.blockTime!,
            ) as Timestamp[];
            await fetchTransactionsRates(
                {
                    symbol: account.symbol as NetworkSymbol,
                    tokenAddress: token as TokenAddress,
                },
                tokenTimestamps,
                localCurrency,
                isElectrumBackend,
                rates,
            );
        }

        return { account, rates };
    },
);

const fetchFn: Record<RateTypeWithoutHistoric, typeof fetchCurrentFiatRates> = {
    current: fetchCurrentFiatRates,
    lastWeek: fetchLastWeekFiatRates,
};

type UpdateCurrentFiatRatesThunkPayload = {
    ticker: TickerId;
    localCurrency: FiatCurrencyCode;
    fetchAttemptTimestamp: Timestamp;
    rateType: RateTypeWithoutHistoric;
    forceFetchToken?: boolean;
};

export const updateFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateFiatRates`,
    async (
        { ticker, localCurrency, rateType, forceFetchToken }: UpdateCurrentFiatRatesThunkPayload,
        { getState },
    ) => {
        if (isTestnet(ticker.symbol)) {
            throw new Error('Testnet');
        }

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
    rateType: RateTypeWithoutHistoric;
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

const ratesTimeouts: Record<RateTypeWithoutHistoric, ReturnType<typeof setTimeout> | null> = {
    current: null,
    lastWeek: null,
};

type PeriodicFetchFiatRatesThunkPayload = {
    rateType: RateTypeWithoutHistoric;
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
