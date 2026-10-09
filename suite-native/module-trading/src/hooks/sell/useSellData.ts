import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { selectTradingSellLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';

export const useSellData = () => {
    const { dispatch } = useServices(injectDispatch);
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
