import { type QueryClient, SILENT_QUERY_META, tradingQueryKeys } from '@suite-common/react-query';
import { type Dispatch } from '@trezor/redux-utils';

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

export type TradingCatalog = 'info' | 'buy' | 'sell' | 'exchange';

/**
 * The catalogs each section reads.
 * The swap catalog is megabytes, so only the swap section loads it.
 */
export const TRADING_SECTION_CATALOGS: Record<TradingType, readonly TradingCatalog[]> = {
    buy: ['info', 'buy', 'sell'],
    sell: ['info', 'buy', 'sell'],
    exchange: ['info', 'buy', 'sell', 'exchange'],
};

export const TRADING_CATALOGS: readonly TradingCatalog[] = ['info', 'buy', 'sell', 'exchange'];

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

type CatalogLoader = (context: TradingCatalogLoadContext) => Promise<void>;

type CatalogLoad<TData> = Omit<TradingCatalogLoadContext, 'dispatch'> & {
    catalog: TradingCatalog;
    fetchCatalog: () => Promise<TData>;
    saveCatalog: (catalogData: TData) => void;
};

/**
 * The store keeps the catalogs for the app's lifetime, so the cache keeps them as long.
 * Offline, a load fails fast into the empty fallbacks of `tradeApi` instead of pausing.
 * Only an unexpected error rejects a load, and retrying a bug does not fix it.
 * Structural sharing would deep-compare the multi-megabyte swap catalog and keep a second copy of it.
 * `tradeApi` logs its failed requests itself, and `loadInitialDataThunk` rejects with anything else.
 */
const CATALOG_QUERY_OPTIONS = {
    gcTime: Infinity,
    networkMode: 'always',
    retry: false,
    structuralSharing: false,
    meta: SILENT_QUERY_META,
} as const;

const loadCatalog = async <TData>({
    catalog,
    queryClient,
    forceReload,
    fetchCatalog,
    saveCatalog,
}: CatalogLoad<TData>) => {
    const serverUrl = tradeApi.getApiServerUrl();
    const catalogData = await queryClient.query({
        ...CATALOG_QUERY_OPTIONS,
        queryKey: tradingQueryKeys.catalog(serverUrl, catalog),
        queryFn: fetchCatalog,
        staleTime: forceReload ? 0 : TRADE_API_RELOAD_DATA_AFTER_MS,
    });

    /**
     * A load that raced a debug server switch belongs to the previous server.
     * A cache hit is saved too, because the store may hold another server's catalog;
     * saving the object it already holds leaves the state untouched.
     */
    if (tradeApi.getApiServerUrl() === serverUrl) {
        saveCatalog(catalogData);
    }
};

const catalogLoaders: Record<TradingCatalog, CatalogLoader> = {
    info: ({ dispatch, ...context }) =>
        loadCatalog({
            ...context,
            catalog: 'info',
            // The cache rejects `undefined`, which `getInfo` returns on a failed request.
            fetchCatalog: async () => (await tradeApi.getInfo()) ?? null,
            saveCatalog: info => {
                // Skip saveInfo on failure so we never replace an existing catalog with empty data.
                if (info) {
                    dispatch(tradingActions.saveInfo(info));
                }
            },
        }),
    buy: ({ dispatch, ...context }) =>
        loadCatalog({
            ...context,
            catalog: 'buy',
            fetchCatalog: () => dispatch(loadBuyInfoThunk()).unwrap(),
            saveCatalog: buyInfo => dispatch(tradingBuyActions.saveBuyInfo(buyInfo)),
        }),
    sell: ({ dispatch, ...context }) =>
        loadCatalog({
            ...context,
            catalog: 'sell',
            fetchCatalog: () => dispatch(loadSellInfoThunk()).unwrap(),
            saveCatalog: sellInfo => dispatch(tradingSellActions.saveSellInfo(sellInfo)),
        }),
    exchange: ({ dispatch, ...context }) =>
        loadCatalog({
            ...context,
            catalog: 'exchange',
            fetchCatalog: () => dispatch(loadExchangeInfoThunk()).unwrap(),
            saveCatalog: exchangeInfo =>
                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfo)),
        }),
};

/**
 * Loads a catalog of the trade API server in use through the query cache and saves it to the store.
 */
export const loadTradingCatalog = (catalog: TradingCatalog, context: TradingCatalogLoadContext) =>
    catalogLoaders[catalog](context);

/**
 * Calls back on every change of a catalog query of any server, because a debug switch can change the server in use.
 * Changes of other queries do not concern the catalog readers.
 */
export const subscribeToTradingCatalogs = (queryClient: QueryClient, onCatalogChange: () => void) =>
    queryClient.getQueryCache().subscribe(({ query }) => {
        if (CATALOG_QUERY_KEY_PREFIX.every((keyPart, index) => query.queryKey[index] === keyPart)) {
            onCatalogChange();
        }
    });

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

    return {
        isLoading: queryStates.some(queryState => queryState?.fetchStatus === 'fetching'),
        // Zero until every catalog has loaded at least once.
        lastLoadedTimestamp: Math.min(
            ...queryStates.map(queryState => queryState?.dataUpdatedAt ?? 0),
        ),
    };
};
