import { fetchCurrentFiatRates, fetchLastWeekFiatRates } from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FiatRatesResult,
    type RateTypeWithoutHistoric,
    type TickerId,
    type TickerResult,
    type Timestamp,
    type WalletAccountTransaction,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    fetchTransactionsRates,
    groupTokensTransactionsByContractAddress,
    isTestnet,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TimerId, exhaustive } from '@trezor/type-utils';
import { typedObjectKeys } from '@trezor/utils';

import { FIAT_RATES_MODULE_PREFIX, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated } from './fiatRatesSelectors';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    selectActiveBackendType,
    selectIsElectrumBackendSelected,
} from '../blockchain/blockchainSelectors';
import { selectTransactionsWithMissingRates } from '../transactions/transactionsSelectors';

type UpdateTxsFiatRatesThunkPayload = {
    accountKey: AccountKey;
    txs: WalletAccountTransaction[];
    baseCurrencyCode: BaseCurrencyCode;
};

// TODO: Refactor this to batch requests as much as possible
export const updateTxsFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateTxsRates`,
    async ({ accountKey, txs, baseCurrencyCode }: UpdateTxsFiatRatesThunkPayload, { getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account || txs?.length === 0 || isTestnet(account.symbol))
            return { account, rates: [] };

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        const rates: TickerResult[] = [];

        const timestamps = txs
            .map(tx => (tx.blockTime !== undefined ? asTimestamp(tx.blockTime) : undefined))
            .filter(it => it !== undefined);

        await fetchTransactionsRates(
            { symbol: account.symbol },
            timestamps,
            baseCurrencyCode,
            isElectrumBackend,
            rates,
        );

        const groupedTokensTxs = groupTokensTransactionsByContractAddress(txs);

        for (const token of typedObjectKeys(groupedTokensTxs)) {
            const hasCoinDefinitions = getNetworkFeatures(account.symbol).includes(
                'coin-definitions',
            );

            if (hasCoinDefinitions) {
                const isTokenKnown = selectIsSpecificCoinDefinitionKnown(
                    getState(),
                    account.symbol,
                    token,
                );

                if (!isTokenKnown) {
                    continue;
                }
            }

            const tokenTxs = groupedTokensTxs[token];
            if (!tokenTxs) {
                continue;
            }

            const tokenTimestamps = tokenTxs
                .map(tx => (tx.blockTime !== undefined ? asTimestamp(tx.blockTime) : undefined))
                .filter(it => it !== undefined);

            await fetchTransactionsRates(
                {
                    symbol: account.symbol,
                    tokenAddress: toTokenAddress(token),
                },
                tokenTimestamps,
                baseCurrencyCode,
                isElectrumBackend,
                rates,
            );
        }

        return { account, rates };
    },
);

type UpdateCurrentFiatRatesThunkPayload = {
    tickers: TickerId[];
    baseCurrencyCode: BaseCurrencyCode;
    fetchAttemptTimestamp: Timestamp;
    rateType: RateTypeWithoutHistoric;
    forceFetchToken?: boolean;
    skipCache?: boolean;
};

export const updateFiatRatesThunk = createThunk<
    PromiseSettledResult<FiatRatesResult>[],
    UpdateCurrentFiatRatesThunkPayload,
    void
>(
    `${FIAT_RATES_MODULE_PREFIX}/updateFiatRates`,
    async (
        { tickers, baseCurrencyCode, rateType, forceFetchToken, skipCache = false },
        { getState },
    ) => {
        const fetchRate = async (ticker: TickerId) => {
            if (isTestnet(ticker.symbol)) {
                throw new Error('Testnet');
            }

            const hasCoinDefinitions = getNetworkFeatures(ticker.symbol).includes(
                'coin-definitions',
            );
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

            const backendType = selectActiveBackendType(getState(), ticker.symbol);

            const rate = await ((): Promise<FiatRatesResult | null> => {
                switch (rateType) {
                    case 'current':
                        return fetchCurrentFiatRates({
                            ticker,
                            localCurrency: baseCurrencyCode,
                            backendType,
                            skipCache,
                        });
                    case 'lastWeek':
                        return fetchLastWeekFiatRates({
                            ticker,
                            localCurrency: baseCurrencyCode,
                            backendType,
                        });
                    default:
                        return exhaustive(rateType);
                }
            })();

            if (!rate) {
                throw new Error(
                    `Failed to fetch fiat rates ${ticker.symbol}, currency ${baseCurrencyCode}, token ${ticker.tokenAddress ?? '-'}, rateType ${rateType}`,
                );
            }

            return rate;
        };

        const rates = await Promise.allSettled(
            tickers.map(ticker =>
                fetchRate(ticker).then(
                    rate => rate,
                    // NOTE: rejection of the promise without string as rejected promises causes warnings in the console
                    error => Promise.reject(String(error)),
                ),
            ),
        );

        return rates;
    },
);

export const updateMissingTxFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/updateMissingTxRates`,
    (
        { localCurrency, accountKey }: { localCurrency: BaseCurrencyCode; accountKey?: AccountKey },
        { dispatch, getState },
    ) => {
        const transactionsWithMissingRates = selectTransactionsWithMissingRates(
            getState(),
            localCurrency,
            accountKey,
        );

        transactionsWithMissingRates.forEach(({ account, txs }) => {
            dispatch(
                updateTxsFiatRatesThunk({
                    accountKey: account.key,
                    txs,
                    baseCurrencyCode: localCurrency,
                }),
            );
        });
    },
);

type FetchFiatRatesThunkPayload = {
    rateType: RateTypeWithoutHistoric;
    localCurrency: BaseCurrencyCode;
};

export const fetchFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/fetchFiatRates`,
    ({ rateType, localCurrency }: FetchFiatRatesThunkPayload, { dispatch, getState }) => {
        const currentTimestamp = asTimestamp(Date.now());
        const tickers = selectTickersToBeUpdated(
            getState(),
            currentTimestamp,
            localCurrency,
            rateType,
        );

        if (tickers.length === 0) return;

        // NOTE: do not await it here, leave it just to return
        // updateFiatRatesThunk is handled in the reducer and we don't need to wait for
        // all the token fiat rates to be loaded as it slows down start of the app massively
        // Because of that, let's chunk the number of fiat rates to be loaded
        // and have then loaded by chunks to not overload the API
        const FIAT_RATES_FETCH_CHUNK_SIZE = 4;
        const tickerChunks = Array.from(
            { length: Math.ceil(tickers.length / FIAT_RATES_FETCH_CHUNK_SIZE) },
            (_, i) =>
                tickers.slice(
                    i * FIAT_RATES_FETCH_CHUNK_SIZE,
                    (i + 1) * FIAT_RATES_FETCH_CHUNK_SIZE,
                ),
        );

        tickerChunks.reduce<Promise<any>>(
            (chain, chunk) =>
                chain.then(() =>
                    dispatch(
                        updateFiatRatesThunk({
                            tickers: chunk,
                            baseCurrencyCode: localCurrency,
                            rateType,
                            fetchAttemptTimestamp: asTimestamp(Date.now()),
                        }),
                    ),
                ),
            Promise.resolve(),
        );

        return;
    },
);

const ratesTimeouts: Record<RateTypeWithoutHistoric, TimerId | null> = {
    current: null,
    lastWeek: null,
};

type PeriodicFetchFiatRatesThunkPayload = {
    rateType: RateTypeWithoutHistoric;
    localCurrency: BaseCurrencyCode;
};

export const periodicFetchFiatRatesThunk = createThunk(
    `${FIAT_RATES_MODULE_PREFIX}/periodicFetchFiatRates`,
    async (
        { rateType, localCurrency }: PeriodicFetchFiatRatesThunkPayload,
        { dispatch, getState, extra },
    ) => {
        const {
            selectors: { selectIsWindowVisible },
        } = extra;
        const isWindowVisible = selectIsWindowVisible(getState());

        if (ratesTimeouts[rateType]) {
            clearTimeout(ratesTimeouts[rateType]!);
        }

        if (isWindowVisible) {
            await dispatch(fetchFiatRatesThunk({ rateType, localCurrency }));
        }
        ratesTimeouts[rateType] = setTimeout(() => {
            dispatch(periodicFetchFiatRatesThunk({ rateType, localCurrency }));
        }, REFETCH_INTERVAL[rateType]);
    },
);
