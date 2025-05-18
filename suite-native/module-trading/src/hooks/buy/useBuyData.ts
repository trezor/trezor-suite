import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingBuyLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';

export const useBuyData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'buy' }));
    }, [dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingBuyLoadingTimestampAndStatus);
};
