import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TRADING_SECTION_CATALOGS,
    selectIsTradingExchangeFullyLoaded,
    tradingThunks,
    useTradingCatalogStatus,
} from '@suite-common/trading';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useExchangeData = () => {
    const { dispatch } = useServices(injectDispatch);
    const account = useSelector(selectExchangeSelectedSendAccount);

    const descriptor = account?.descriptor;

    const loadData = useCallback(
        (forceReload = true) =>
            dispatch(
                tradingThunks.loadInitialDataThunk({
                    activeSection: 'exchange',
                    forceReload,
                }),
            ),
        [dispatch],
    );

    useEffect(() => {
        loadData(false);
    }, [descriptor, loadData]);

    const { isLoading, lastLoadedTimestamp } = useTradingCatalogStatus(
        TRADING_SECTION_CATALOGS.exchange,
    );
    const isFullyLoaded = useSelector(selectIsTradingExchangeFullyLoaded);

    return { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch: loadData };
};
