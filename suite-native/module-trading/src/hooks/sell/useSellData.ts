import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { selectTradingSellLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

export const useSellData = () => {
    const dispatch = useDispatch();
    const account = useSelector(selectSellSelectedSendAccount);

    const descriptor = account?.descriptor;

    const loadData = useCallback(
        (forceReload = true) =>
            dispatch(
                tradingThunks.loadInitialDataThunk({
                    activeSection: 'sell',
                    forceReload,
                }),
            ),
        [dispatch],
    );

    useEffect(() => {
        loadData(false);
    }, [descriptor, loadData]);

    const loadingStatus = useSelector(selectTradingSellLoadingTimestampAndStatus);

    return { ...loadingStatus, refetch: loadData };
};
