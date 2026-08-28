import {
    fetchCurrentFiatRates,
    fetchErc4626UnderlyingAsset,
    fetchLastWeekFiatRates,
} from '@suite-common/fiat-services';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type GetIsWindowVisibleDep } from '@suite-common/suite-types';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type BackendType, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type Account,
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
    getErc4626Contracts,
    groupTokensTransactionsByContractAddress,
    isTestnet,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type TimerId, exhaustive } from '@trezor/type-utils';
import { BigNumber, isNotUndefined, typedObjectKeys } from '@trezor/utils';

import { FIAT_RATES_MODULE_PREFIX, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated } from './fiatRatesSelectors';
import { type FiatRatesRootState } from './fiatRatesTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { type BlockchainRootState } from '../blockchain/blockchainReducer';
import {
    selectActiveBackendType,
    selectIsElectrumBackendSelected,
} from '../blockchain/blockchainSelectors';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactionsWithMissingRates } from '../transactions/transactionsSelectors';

interface FetchErc4626FiatRateProps {
    ticker: TickerId;
    rateType: RateTypeWithoutHistoric;
    baseCurrencyCode: BaseCurrencyCode;
    backendType: BackendType | undefined;
    skipCache: boolean;
}

const fetchErc4626FiatRate = async ({
    ticker,
    rateType,
    baseCurrencyCode,
    backendType,
    skipCache,
}: FetchErc4626FiatRateProps): Promise<FiatRatesResult> => {
    if (!ticker.tokenAddress) {
        throw new Error('Token address is missing from ERC4626 token');
    }

    const underlyingAsset = await fetchErc4626UnderlyingAsset({
        coin: ticker.symbol,
        contract: ticker.tokenAddress,
    });

    const fetchFiatRatesFn =
        rateType === 'current' ? fetchCurrentFiatRates : fetchLastWeekFiatRates;

    const underlyingAssetRate = await fetchFiatRatesFn({
        ticker: { symbol: ticker.symbol, tokenAddress: underlyingAsset.contract },
        localCurrency: baseCurrencyCode,
        backendType,
        skipCache,
    });

    if (!underlyingAssetRate?.rate) {
        throw new Error(
            `Failed to fetch underlying asset fiat rate for ERC4626 token ${underlyingAsset.contract}`,
        );
    }

    // calculate vault fiat rate
    const vaultRate = new BigNumber(underlyingAssetRate.rate)
        .multipliedBy(underlyingAsset.exchangeRate)
        .toNumber();

    return { rate: vaultRate, lastTickerTimestamp: underlyingAssetRate.lastTickerTimestamp };
};

type UpdateTxsFiatRatesThunkPayload = {
    accountKey: AccountKey;
    txs: WalletAccountTransaction[];
    baseCurrencyCode: BaseCurrencyCode;
};
type UpdateTxsFiatRatesThunkResult = {
    account: Account | null;
    rates: TickerResult[];
};

// TODO: Refactor this to batch requests as much as possible
type UpdateTxsFiatRatesThunkState = AccountsRootState &
    BlockchainRootState &
    TokenDefinitionsRootState;

export const updateTxsFiatRatesThunk = createThunk<
    UpdateTxsFiatRatesThunkResult,
    UpdateTxsFiatRatesThunkPayload,
    { state: UpdateTxsFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/updateTxsRates`,
    async ({ accountKey, txs, baseCurrencyCode }, { getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        if (!account || txs?.length === 0 || isTestnet(account.symbol))
            return { account, rates: [] };

        const isElectrumBackend = selectIsElectrumBackendSelected(getState(), account.symbol);

        const rates: TickerResult[] = [];

        const timestamps = txs
            .map(tx => (tx.blockTime !== undefined ? asTimestamp(tx.blockTime) : undefined))
            .filter(isNotUndefined);

        await fetchTransactionsRates(
            { symbol: account.symbol },
            timestamps,
            baseCurrencyCode,
            isElectrumBackend,
            rates,
        );

        const groupedTokensTxs = groupTokensTransactionsByContractAddress(txs);
        const erc4626Contracts = getErc4626Contracts(account.tokens);

        for (const token of typedObjectKeys(groupedTokensTxs)) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const tokenTransactions: WalletAccountTransaction[] = groupedTokensTxs[token];
            const tokenTimestamps = tokenTransactions
                .map(tx => (tx.blockTime !== undefined ? asTimestamp(tx.blockTime) : undefined))
                .filter(isNotUndefined);

            // Historical ERC4626 rates cannot be calculated without historical share-to-asset ratios.
            if (erc4626Contracts.has(token.toLowerCase())) {
                continue;
            }

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
export type UpdateFiatRatesThunkState = BlockchainRootState & TokenDefinitionsRootState;

export const updateFiatRatesThunk = createThunk<
    PromiseSettledResult<FiatRatesResult>[],
    UpdateCurrentFiatRatesThunkPayload,
    { state: UpdateFiatRatesThunkState }
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

            const backendType = selectActiveBackendType(getState(), ticker.symbol);

            // fetch ERC4626 fiat rate from Blockbook
            if (
                ticker.protocols?.includes('erc4626') &&
                (!backendType || backendType === 'blockbook')
            ) {
                return fetchErc4626FiatRate({
                    ticker,
                    rateType,
                    baseCurrencyCode,
                    backendType,
                    skipCache,
                });
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

export type UpdateMissingTxFiatRatesThunkState = FiatRatesRootState &
    TransactionsRootState &
    UpdateTxsFiatRatesThunkState;
type UpdateMissingTxFiatRatesThunkParams = {
    localCurrency: BaseCurrencyCode;
    accountKey?: AccountKey;
};

export const updateMissingTxFiatRatesThunk = createThunk<
    void,
    UpdateMissingTxFiatRatesThunkParams,
    { state: UpdateMissingTxFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/updateMissingTxRates`,
    ({ localCurrency, accountKey }, { dispatch, getState }) => {
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

type FetchFiatRatesThunkState = AccountsRootState &
    BlockchainRootState &
    FiatRatesRootState &
    TokenDefinitionsRootState;

export const fetchFiatRatesThunk = createThunk<
    void,
    FetchFiatRatesThunkPayload,
    { state: FetchFiatRatesThunkState }
>(
    `${FIAT_RATES_MODULE_PREFIX}/fetchFiatRates`,
    ({ rateType, localCurrency }, { dispatch, getState }) => {
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

export type PeriodicFetchFiatRatesThunkDeps = WithServices<GetIsWindowVisibleDep>;
export type PeriodicFetchFiatRatesThunkState = FetchFiatRatesThunkState;

export const periodicFetchFiatRatesThunk = createThunk<
    void,
    PeriodicFetchFiatRatesThunkPayload,
    { state: PeriodicFetchFiatRatesThunkState; extra: PeriodicFetchFiatRatesThunkDeps }
>(
    `${FIAT_RATES_MODULE_PREFIX}/periodicFetchFiatRates`,
    async ({ rateType, localCurrency }, { dispatch, extra }) => {
        const {
            services: { getIsWindowVisible },
        } = extra;
        const isWindowVisible = getIsWindowVisible();

        if (ratesTimeouts[rateType]) {
            clearTimeout(ratesTimeouts[rateType]);
        }

        if (isWindowVisible) {
            await dispatch(fetchFiatRatesThunk({ rateType, localCurrency }));
        }
        ratesTimeouts[rateType] = setTimeout(() => {
            dispatch(periodicFetchFiatRatesThunk({ rateType, localCurrency }));
        }, REFETCH_INTERVAL[rateType]);
    },
);
