import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectTradingExchangeLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';

export const useExchangeData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'exchange' }));
    }, [dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingExchangeLoadingTimestampAndStatus);
};
