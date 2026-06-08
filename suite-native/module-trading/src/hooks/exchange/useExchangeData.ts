import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectTradingExchangeLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';
import { getRandomAccountDescriptor } from '@suite-native/trading-quote-utils';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export const useExchangeData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();
    const account = useSelector(selectExchangeSelectedSendAccount);

    const descriptor = account?.descriptor;

    useEffect(() => {
        dispatch(
            tradingThunks.loadInitialDataThunk({
                activeSection: 'exchange',
                forcedApiKey: descriptor ? undefined : getRandomAccountDescriptor(),
            }),
        );
    }, [descriptor, dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingExchangeLoadingTimestampAndStatus);
};
