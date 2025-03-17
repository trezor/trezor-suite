import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingLoadingAndTimestamp, tradingThunks } from '@suite-common/trading';

export const useTradingBuyData = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'buy' }));
    }, [dispatch]);

    return useSelector(selectTradingLoadingAndTimestamp);
};
