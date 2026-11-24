import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TRADING_CATALOGS,
    TRADING_SECTION_CATALOGS,
    selectIsTradingBuyFullyLoaded,
    tradingThunks,
    useTradingCatalogStatus,
} from '@suite-common/trading';
import { selectBuySelectedReceiveAccount } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useBuyData = () => {
    const { dispatch } = useServices(injectDispatch);
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const descriptor = selectedReceiveAccount?.account?.descriptor;

    const loadData = useCallback(
        (forceReload = true) =>
            dispatch(
                tradingThunks.loadInitialDataThunk({
                    activeSection: 'buy',
                    // Every catalog, so that switching the trading tabs is instant.
                    catalogs: TRADING_CATALOGS,
                    forceReload,
                }),
            ),
        [dispatch],
    );

    useEffect(() => {
        loadData(false);
    }, [descriptor, loadData]);

    const { isLoading, lastLoadedTimestamp } = useTradingCatalogStatus(
        TRADING_SECTION_CATALOGS.buy,
    );
    const isFullyLoaded = useSelector(selectIsTradingBuyFullyLoaded);

    return { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch: loadData };
};
