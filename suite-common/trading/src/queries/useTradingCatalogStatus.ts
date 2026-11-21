import { useSyncExternalStore } from 'react';

import { injectQueryClient } from '@suite-common/react-query';
import { useServices } from '@trezor/dependency-injection';

import {
    TRADING_CATALOGS,
    type TradingCatalog,
    type TradingCatalogStatus,
    getTradingCatalogStatus,
    subscribeToTradingCatalogs,
} from '../thunks/common/tradingCatalogs';

/**
 * The loading state of catalogs of the server in use, read from the query cache that loads them.
 * It subscribes to the cache instead of observing the queries,
 * because an observer would replace their options and turn structural sharing of the multi-megabyte swap catalog back on.
 */
export const useTradingCatalogStatus = (
    catalogs: readonly TradingCatalog[] = TRADING_CATALOGS,
): TradingCatalogStatus => {
    const { queryClient } = useServices(injectQueryClient);
    // The React Compiler memoizes this on the query client, so renders do not resubscribe to the cache.
    const subscribe = (onCatalogChange: () => void) =>
        subscribeToTradingCatalogs(queryClient, onCatalogChange);

    // Primitive snapshots stay equal between cache changes, which a status object would not.
    const isLoading = useSyncExternalStore(
        subscribe,
        () => getTradingCatalogStatus(queryClient, catalogs).isLoading,
    );
    const lastLoadedTimestamp = useSyncExternalStore(
        subscribe,
        () => getTradingCatalogStatus(queryClient, catalogs).lastLoadedTimestamp,
    );

    return { isLoading, lastLoadedTimestamp };
};
