import { fetchCurrentFiatRates, fetchLastWeekFiatRates } from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import { selectIsSpecificCoinDefinitionKnown } from '@suite-common/token-definitions';
import {
    type BackendType,
    type NetworkSymbol,
    getNetworkFeatures,
} from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FiatRatesResult,
    type RateTypeWithoutHistoric,
    type TickerId,
    type TickerResult,
    type Timestamp,
    type TokenAddress,
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
import TrezorConnect from '@trezor/connect';
import { type TimerId, exhaustive } from '@trezor/type-utils';
import { BigNumber, typedObjectKeys } from '@trezor/utils';

import { FIAT_RATES_MODULE_PREFIX, REFETCH_INTERVAL } from './fiatRatesConstants';
import { selectTickersToBeUpdated } from './fiatRatesSelectors';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    selectActiveBackendType,
    selectIsElectrumBackendSelected,
} from '../blockchain/blockchainSelectors';
import { selectTransactionsWithMissingRates } from '../transactions/transactionsSelectors';

interface FetchErc4626DataProps {
    coin: NetworkSymbol;
    contract: TokenAddress;
}

const fetchErc4626Data = async ({ coin, contract }: FetchErc4626DataProps) => {
    const response = await TrezorConnect.blockchainGetContractInfo({
        coin,
        contract,
        protocols: ['erc4626'],
    });

    if (!response.success) {
        throw new Error(`Error fetching ERC4626 token info for ${contract}`);
    }

    if (!response.payload.protocols?.erc4626) {
        throw new Error(`ERC4626 token ${contract} is missing ERC4626 data`);
    }

    return response.payload.protocols.erc4626;
};

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

    const erc4626 = await fetchErc4626Data({ coin: ticker.symbol, contract: ticker.tokenAddress });

    if (!erc4626.asset) {
        throw new Error(`ERC4626 token ${ticker.tokenAddress} is missing underlying asset data`);
    }

    // convertToAssets1Share is raw underlying asset units per 1 whole vault share
    if (!erc4626.convertToAssets1Share) {
        throw new Error(`ERC4626 token ${ticker.tokenAddress} is missing convertToAssets1Share`);
    }

    const fetchFiatRatesFn =
        rateType === 'current' ? fetchCurrentFiatRates : fetchLastWeekFiatRates;

    const underlyingAssetRate = await fetchFiatRatesFn({
        ticker: { symbol: ticker.symbol, tokenAddress: toTokenAddress(erc4626.asset.contract) },
        localCurrency: baseCurrencyCode,
        backendType,
        skipCache,
    });

    if (!underlyingAssetRate?.rate) {
        throw new Error(
            `Failed to fetch underlying asset fiat rate for ERC4626 token ${erc4626.asset.contract}`,
        );
    }

    // get exchange ratio
    const exchangeRate = new BigNumber(erc4626.convertToAssets1Share).shiftedBy(
        -erc4626.asset.decimals,
    );
    // calculate vault fiat rate
    const vaultRate = new BigNumber(underlyingAssetRate.rate).multipliedBy(exchangeRate).toNumber();

    return { rate: vaultRate, lastTickerTimestamp: underlyingAssetRate.lastTickerTimestamp };
};

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

            const tokenTimestamps = groupedTokensTxs[token]
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
