import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingBuyLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';
import { getRandomAccountDescriptor } from '@suite-native/trading-quote-utils';
import { selectBuySelectedReceiveAccount } from '@suite-native/trading-state';

export const useBuyData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const descriptor = selectedReceiveAccount?.account?.descriptor;

    useEffect(() => {
        dispatch(
            tradingThunks.loadInitialDataThunk({
                activeSection: 'buy',
                forcedApiKey: !descriptor ? getRandomAccountDescriptor() : undefined,
            }),
        );
    }, [descriptor, dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingBuyLoadingTimestampAndStatus);
};
