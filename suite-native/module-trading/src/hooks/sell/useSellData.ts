import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingSellLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';
import { getRandomAccountDescriptor } from '@suite-native/trading-quote-utils';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

export const useSellData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();
    const account = useSelector(selectSellSelectedSendAccount);

    const descriptor = account?.descriptor;

    useEffect(() => {
        dispatch(
            tradingThunks.loadInitialDataThunk({
                activeSection: 'sell',
                forcedApiKey: descriptor ? undefined : getRandomAccountDescriptor(),
            }),
        );
    }, [descriptor, dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingSellLoadingTimestampAndStatus);
};
