import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import {
    selectTradingExchangeLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export const useExchangeData = () => {
    const { dispatch } = useServices(selectDispatch);
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

    const loadingStatus = useSelector(selectTradingExchangeLoadingTimestampAndStatus);

    return { ...loadingStatus, refetch: loadData };
};
