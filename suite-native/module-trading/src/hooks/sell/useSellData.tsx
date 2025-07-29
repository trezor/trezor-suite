import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingSellLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';

import { getRandomAccountDescriptor } from '../../utils/general/utils';

export const useSellData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(
            tradingThunks.loadInitialDataThunk({
                activeSection: 'sell',
                forcedApiKey: getRandomAccountDescriptor(),
            }),
        );
    }, [dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingSellLoadingTimestampAndStatus);
};
