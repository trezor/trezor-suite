import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import {
    getRandomAccountDescriptor,
    selectTradingBuyLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';
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
