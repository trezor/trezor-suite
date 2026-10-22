import { A, F, pipe } from '@mobily/ts-belt';
import { QueryStatus } from '@reduxjs/toolkit/query';

import { type DeviceRootState } from '@suite-common/device';
import {
    type TokenDefinitionsRootState,
    type TokenDefinitionsState,
    selectIsSpecificCoinDefinitionKnown,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type Account,
    type CryptoBaseCurrencyPair,
    type CurrentFiatRatesResult,
    type CurrentRate,
    type CurrentRatesByKey,
    type Rate,
    type RateTypeWithoutHistoric,
    type RatesByKey,
    type RatesByTimestamps,
    type TickerId,
    type Timestamp,
    type TokenAddress,
    asTimestamp,
} from '@suite-common/wallet-types';
import {
    getFiatRateKeyFromTicker,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { createWeakMapSelector, weakMapMemoize } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    type FiatRateEndpointName,
    type FiatRateQueryArgs,
    type FiatRatesApiRootState,
    getFiatRateKeyFromQueryCacheKey,
} from './fiatRatesApi';
import { type FiatRatesHistoricRootState, type FiatRatesRootState } from './fiatRatesTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';
import {
    selectAccountByKey,
    selectAccounts,
    selectDeviceAccounts,
} from '../accounts/accountsSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<FiatRatesRootState>();

export const createStableFiatRateKeys = weakMapMemoize(
    (...fiatRateKeys: CryptoBaseCurrencyPair[]) => fiatRateKeys,
);

export const createStableTickerId = weakMapMemoize(
    (symbol: NetworkSymbol, tokenAddress?: TokenAddress): TickerId =>
        tokenAddress ? { symbol, tokenAddress } : { symbol },
);

export const createStableTickerIds = weakMapMemoize((...tickers: TickerId[]) => tickers);

const createStableRatesByKey = weakMapMemoize(
    (fiatRateKeys: CryptoBaseCurrencyPair[], ...rates: (Rate | undefined)[]): RatesByKey =>
        fiatRateKeys.reduce<RatesByKey>((ratesByKey, fiatRateKey, index) => {
            const rate = rates[index];
            if (rate) {
                ratesByKey[fiatRateKey] = rate;
            }

            return ratesByKey;
        }, {}),
);

type FiatRatesApiQueries = FiatRatesRootState['fiatRatesApi']['queries'];
type FiatRatesApiQueryEntry = NonNullable<FiatRatesApiQueries[string]>;

// Every cache entry maps to one rate object, so it stays referentially stable until the entry
// itself changes, e.g. while other rates resolve during discovery.
const getRateFromQueryEntry = weakMapMemoize((entry: FiatRatesApiQueryEntry): CurrentRate => {
    const { ticker } = entry.originalArgs as unknown as FiatRateQueryArgs;
    // Last week rates have no dollar rate, but they share the shape of the current ones otherwise.
    const data = entry.data as CurrentFiatRatesResult | undefined;
    const rateStatus = {
        lastTickerTimestamp: data?.lastTickerTimestamp ?? asTimestamp(0),
        lastSuccessfulFetchTimestamp: asTimestamp(entry.fulfilledTimeStamp ?? 0),
        isLoading: entry.status === QueryStatus.pending,
        error: entry.status === QueryStatus.rejected ? String(entry.error) : null,
        ticker,
    };

    return data ? { ...data, ...rateStatus } : rateStatus;
});

const getRatesByKeyFromQueries = (
    queries: FiatRatesApiQueries,
    endpointName: FiatRateEndpointName,
): CurrentRatesByKey =>
    Object.entries(queries).reduce<CurrentRatesByKey>((ratesByKey, [queryCacheKey, entry]) => {
        if (entry?.endpointName !== endpointName || entry.status === QueryStatus.uninitialized) {
            return ratesByKey;
        }

        const fiatRateKey = getFiatRateKeyFromQueryCacheKey(endpointName, queryCacheKey);
        ratesByKey[fiatRateKey] = getRateFromQueryEntry(entry);

        return ratesByKey;
    }, {});

const selectFiatRatesApiQueries = (state: FiatRatesApiRootState): FiatRatesApiQueries =>
    state.fiatRatesApi.queries;

/**
 * Whether some of the given cached rates are being fetched for the first time, or are not
 * requested yet.
 */
export const selectIsSomeFiatRateQueryLoading = (
    state: FiatRatesApiRootState,
    queryCacheKeys: readonly string[],
) => {
    const queries = selectFiatRatesApiQueries(state);

    return queryCacheKeys.some(queryCacheKey => {
        const entry = queries[queryCacheKey];

        return !entry || (entry.status === QueryStatus.pending && entry.data === undefined);
    });
};

/**
 * Whether some of the given cached rates are being fetched, for the first time or again.
 */
export const selectIsSomeFiatRateQueryFetching = (
    state: FiatRatesApiRootState,
    queryCacheKeys: readonly string[],
) => {
    const queries = selectFiatRatesApiQueries(state);

    return queryCacheKeys.some(
        queryCacheKey => queries[queryCacheKey]?.status === QueryStatus.pending,
    );
};

export const selectCurrentFiatRates = createMemoizedSelector(
    [selectFiatRatesApiQueries],
    (queries): CurrentRatesByKey => getRatesByKeyFromQueries(queries, 'getCurrentFiatRate'),
);

const getRatesByLowerCasedKey = weakMapMemoize(
    (currentFiatRates: RatesByKey) =>
        new Map(Object.entries(currentFiatRates).map(([key, rate]) => [key.toLowerCase(), rate])),
);

const getCurrentFiatRate = (
    currentFiatRates: CurrentRatesByKey,
    fiatRateKey: CryptoBaseCurrencyPair,
): CurrentRate | undefined =>
    currentFiatRates[fiatRateKey] ??
    (getRatesByLowerCasedKey(currentFiatRates).get(fiatRateKey.toLowerCase()) as
        CurrentRate | undefined);

export const selectCurrentFiatRatesByFiatRateKeys = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        (_state: FiatRatesRootState, fiatRateKeys: readonly CryptoBaseCurrencyPair[]) =>
            fiatRateKeys,
    ],
    (currentFiatRates, fiatRateKeys): RatesByKey =>
        createStableRatesByKey(
            createStableFiatRateKeys(...fiatRateKeys),
            ...fiatRateKeys.map(fiatRateKey => getCurrentFiatRate(currentFiatRates, fiatRateKey)),
        ),
);

export const selectCurrentFiatRateByKey = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
): CurrentRate | undefined => getCurrentFiatRate(selectCurrentFiatRates(state), fiatRateKey);

export const selectLastWeekFiatRates = createMemoizedSelector(
    [selectFiatRatesApiQueries],
    (queries): RatesByKey => getRatesByKeyFromQueries(queries, 'getLastWeekFiatRate'),
);

export const selectHistoricFiatRates = (state: FiatRatesHistoricRootState): RatesByTimestamps =>
    state.wallet.fiat.historic;

export const selectFiatRatesByFiatRateKey = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    rateType: RateTypeWithoutHistoric = 'current',
): Rate | undefined => {
    switch (rateType) {
        case 'current':
            return selectCurrentFiatRates(state)[fiatRateKey];
        case 'lastWeek':
            return selectLastWeekFiatRates(state)[fiatRateKey];
        default:
            return exhaustive(rateType);
    }
};

export const selectHistoricFiatRatesByTimestamp = (
    state: FiatRatesHistoricRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    timestamp: Timestamp | undefined,
): number | undefined => {
    if (timestamp === undefined) return undefined;

    const roundedTimestamp = roundTimestampToNearestPastHour(timestamp);

    return state.wallet.fiat?.['historic']?.[fiatRateKey]?.[roundedTimestamp];
};

export const selectIsFiatRateLoading = (
    state: FiatRatesRootState,
    fiatRateKey: CryptoBaseCurrencyPair,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const currentRate = selectFiatRatesByFiatRateKey(state, fiatRateKey, rateType);

    return currentRate?.isLoading ?? false;
};

export const selectIsTickerLoading = (
    state: FiatRatesRootState,
    ticker: TickerId,
    fiatCurrency: BaseCurrencyCode,
    rateType: RateTypeWithoutHistoric = 'current',
) => {
    const fiatRateKey = getFiatRateKeyFromTicker(ticker, fiatCurrency);

    return selectIsFiatRateLoading(state, fiatRateKey, rateType);
};

type SelectTickerFromAccountsState = TokenDefinitionsRootState & AccountsRootState;

const createTickerSelector = createWeakMapSelector.withTypes<SelectTickerFromAccountsState>();

const EMPTY_TICKERS: TickerId[] = [];

/**
 * Tickers of the given accounts and their tokens with a balance, native coins first. Tokens of
 * networks with coin definitions are included only when they are known.
 */
export const getTickersFromAccounts = (
    accounts: readonly Account[],
    tokenDefinitions: TokenDefinitionsState,
): TickerId[] =>
    pipe(
        accounts,
        A.map((account): TickerId[] => [
            {
                symbol: account.symbol,
            },
            ...(account.tokens || [])
                .filter(token => new BigNumber(token.balance ?? '0').gt(0))
                .map(
                    token =>
                        ({
                            symbol: account.symbol,
                            tokenAddress: token.contract as TokenAddress,
                            protocols: token.protocols,
                        }) satisfies TickerId,
                ),
        ]),
        A.flat,
        A.filter(
            ticker =>
                !ticker.tokenAddress ||
                !getNetworkFeatures(ticker.symbol).includes('coin-definitions') ||
                selectIsSpecificCoinDefinitionKnown(
                    { tokenDefinitions },
                    ticker.symbol,
                    ticker.tokenAddress,
                ),
        ),
        A.uniqBy(ticker =>
            ticker.tokenAddress ? `${ticker.symbol}-${ticker.tokenAddress}` : ticker.symbol,
        ),
        A.sortBy(ticker => (ticker.tokenAddress ? 1 : 0)),
        F.toMutable,
    );

/**
 * Tickers of the accounts of all remembered devices and wallets, not just the selected one, so that
 * e.g. tokens that exist only on a non-selected passphrase wallet get their rates too.
 */
export const selectTickerFromAccounts = createTickerSelector(
    [selectAccounts, selectTokenDefinitions],
    getTickersFromAccounts,
);

const createDeviceTickerSelector = createWeakMapSelector.withTypes<
    SelectTickerFromAccountsState & DeviceRootState
>();

/**
 * Tickers of the accounts of the selected device.
 */
export const selectTickersFromDeviceAccounts = createDeviceTickerSelector(
    [selectDeviceAccounts, selectTokenDefinitions],
    getTickersFromAccounts,
);

/**
 * Tickers of one account and its tokens.
 */
export const selectTickersFromAccount = createTickerSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions): TickerId[] =>
        account ? getTickersFromAccounts([account], tokenDefinitions) : EMPTY_TICKERS,
);
