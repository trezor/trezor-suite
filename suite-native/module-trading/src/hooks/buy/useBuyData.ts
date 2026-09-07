import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { selectTradingBuyLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';
import { selectBuySelectedReceiveAccount } from '@suite-native/trading-state';

export const useBuyData = () => {
    const dispatch = useDispatch();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const descriptor = selectedReceiveAccount?.account?.descriptor;

    const loadData = useCallback(
        (forceReload = true) =>
            dispatch(
                tradingThunks.loadInitialDataThunk({
                    activeSection: 'buy',
                    forceReload,
                }),
            ),
        [dispatch],
    );

    useEffect(() => {
        loadData(false);
    }, [descriptor, loadData]);

    const loadingStatus = useSelector(selectTradingBuyLoadingTimestampAndStatus);

    return { ...loadingStatus, refetch: loadData };
};
