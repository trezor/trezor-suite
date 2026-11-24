import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TRADING_CATALOGS,
    TRADING_SECTION_CATALOGS,
    selectIsTradingSellFullyLoaded,
    tradingThunks,
    useTradingCatalogStatus,
} from '@suite-common/trading';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useSellData = () => {
    const { dispatch } = useServices(injectDispatch);
    const account = useSelector(selectSellSelectedSendAccount);

    const descriptor = account?.descriptor;

    const loadData = useCallback(
        (forceReload = true) =>
            dispatch(
                tradingThunks.loadInitialDataThunk({
                    activeSection: 'sell',
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
        TRADING_SECTION_CATALOGS.sell,
    );
    const isFullyLoaded = useSelector(selectIsTradingSellFullyLoaded);

    return { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch: loadData };
};
