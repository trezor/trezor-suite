import { lruMemoize } from '@reduxjs/toolkit';

import {
    type Query,
    type QueryCacheNotifyEvent,
    type QueryClient,
    type QueryKey,
    partialMatchKey,
    tradingQueryKeys,
} from '@suite-common/react-query';
import { type Dispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { TRADE_API_RELOAD_DATA_AFTER_MS } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { tradeApi } from '../../tradeApi';
import { type TradingType } from '../../types';
import { loadBuyInfoThunk } from '../buy/loadBuyInfoThunk';
import { loadExchangeInfoThunk } from '../exchange/loadExchangeInfoThunk';
import { loadSellInfoThunk } from '../sell/loadSellInfoThunk';

export const TRADING_CATALOGS = ['info', 'buy', 'sell', 'exchange'] as const;

export type TradingCatalog = (typeof TRADING_CATALOGS)[number];

/**
 * The catalogs each section reads.
 * The swap catalog is megabytes, so only the swap section loads it.
 */
export const TRADING_SECTION_CATALOGS: Record<TradingType, readonly TradingCatalog[]> = {
    buy: ['info', 'buy', 'sell'],
    sell: ['info', 'buy', 'sell'],
    exchange: ['info', 'buy', 'sell', 'exchange'],
};

const CATALOG_QUERY_KEY_PREFIX = tradingQueryKeys.catalogs();

export type TradingCatalogStatus = {
    isLoading: boolean;
    lastLoadedTimestamp: number;
};

type TradingCatalogLoadContext = {
    dispatch: Dispatch;
    queryClient: QueryClient;
    forceReload: boolean;
};

type CatalogLoad<TData> = Omit<TradingCatalogLoadContext, 'dispatch'> & {
    catalog: TradingCatalog;
    fetchCatalog: () => Promise<TData>;
    saveCatalog: (catalogData: TData) => void;
};

// A failed coin info is cached as `null`, so it is stale at once and the next load retries it.
const getCatalogStaleTime = <TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
    query: Query<TQueryFnData, TError, TData, TQueryKey>,
) => (query.state.data === null ? 0 : TRADE_API_RELOAD_DATA_AFTER_MS);

/**
 * Offline, a load fails fast into the empty fallbacks of `tradeApi` instead of pausing.
 * Only an unexpected error rejects a load, and retrying a bug does not fix it.
 * Structural sharing would deep-compare the multi-megabyte swap catalog and keep a second copy of it.
 */
const CATALOG_QUERY_OPTIONS = {
    staleTime: getCatalogStaleTime,
    // Never collected: the loading status reads the load time from this entry, while Redux holds the data.
    gcTime: Infinity,
    networkMode: 'always',
    retry: false,
    structuralSharing: false,
} as const;

const loadCatalog = async <TData>({
    catalog,
    queryClient,
    forceReload,
    fetchCatalog,
    saveCatalog,
}: CatalogLoad<TData>) => {
    const serverUrl = tradeApi.getApiServerUrl();
    // A load that raced a debug server switch belongs to the previous server.
    const saveCatalogOfServerInUse = (catalogData: TData) => {
        if (tradeApi.getApiServerUrl() === serverUrl) {
            saveCatalog(catalogData);
        }
    };

    let isFetched = false;
    const catalogData = await queryClient.query({
        ...CATALOG_QUERY_OPTIONS,
        queryKey: tradingQueryKeys.catalog(serverUrl, catalog),
        // Saved before the cache reports the load as finished, so its loading status never runs ahead of the store.
        queryFn: async () => {
            const fetchedCatalog = await fetchCatalog();
            isFetched = true;
            saveCatalogOfServerInUse(fetchedCatalog);

            return fetchedCatalog;
        },
        ...(forceReload && { staleTime: 0 }),
    });

    /**
     * A cache hit is saved too, because the store may hold another server's catalog.
     * Saving the object it already holds leaves the state untouched.
     */
    if (!isFetched) {
        saveCatalogOfServerInUse(catalogData);
    }
};

/**
 * Loads a catalog of the trade API server in use through the query cache and saves it to the store.
 */
export const loadTradingCatalog = (
    catalog: TradingCatalog,
    { dispatch, ...context }: TradingCatalogLoadContext,
): Promise<void> => {
    switch (catalog) {
        case 'info':
            return loadCatalog({
                ...context,
                catalog,
                // The cache rejects `undefined`, which `getInfo` returns on a failed request.
                fetchCatalog: async () => (await tradeApi.getInfo()) ?? null,
                saveCatalog: info => {
                    // Skip saveInfo on failure so we never replace an existing catalog with empty data.
                    if (info) {
                        dispatch(tradingActions.saveInfo(info));
                    }
                },
            });
        case 'buy':
            return loadCatalog({
                ...context,
                catalog,
                fetchCatalog: () => dispatch(loadBuyInfoThunk()).unwrap(),
                saveCatalog: buyInfo => dispatch(tradingBuyActions.saveBuyInfo(buyInfo)),
            });
        case 'sell':
            return loadCatalog({
                ...context,
                catalog,
                fetchCatalog: () => dispatch(loadSellInfoThunk()).unwrap(),
                saveCatalog: sellInfo => dispatch(tradingSellActions.saveSellInfo(sellInfo)),
            });
        case 'exchange':
            return loadCatalog({
                ...context,
                catalog,
                fetchCatalog: () => dispatch(loadExchangeInfoThunk()).unwrap(),
                saveCatalog: exchangeInfo =>
                    dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfo)),
            });
        default:
            return exhaustive(catalog);
    }
};

/**
 * Calls back on the given events of a catalog query of any server, because a debug switch can change the server in use.
 * Changes of other queries do not concern the catalog readers.
 */
export const subscribeToTradingCatalogs = (
    queryClient: QueryClient,
    eventTypes: ReadonlySet<QueryCacheNotifyEvent['type']>,
    onCatalogChange: () => void,
) =>
    queryClient.getQueryCache().subscribe(({ type, query }) => {
        if (eventTypes.has(type) && partialMatchKey(query.queryKey, CATALOG_QUERY_KEY_PREFIX)) {
            onCatalogChange();
        }
    });

// The loading status reads the state of a catalog query, so only its updates and removal change it.
export const TRADING_CATALOG_STATUS_EVENT_TYPES: ReadonlySet<QueryCacheNotifyEvent['type']> =
    new Set(['updated', 'removed']);

// One object per status keeps the status hook's snapshot stable, for each of the 4 catalog lists that screens read.
const toTradingCatalogStatus = lruMemoize(
    (isLoading: boolean, lastLoadedTimestamp: number): TradingCatalogStatus => ({
        isLoading,
        lastLoadedTimestamp,
    }),
    { maxSize: 4 },
);

/**
 * The loading state of catalogs of the server in use, which a debug switch can change mid-load.
 */
export const getTradingCatalogStatus = (
    queryClient: QueryClient,
    catalogs: readonly TradingCatalog[],
): TradingCatalogStatus => {
    const queryStates = catalogs.map(catalog =>
        queryClient.getQueryState(tradingQueryKeys.catalog(tradeApi.getApiServerUrl(), catalog)),
    );

    return toTradingCatalogStatus(
        queryStates.some(queryState => queryState?.fetchStatus === 'fetching'),
        // Zero until every catalog has loaded at least once, and for an empty list.
        queryStates.length === 0
            ? 0
            : Math.min(...queryStates.map(queryState => queryState?.dataUpdatedAt ?? 0)),
    );
};
