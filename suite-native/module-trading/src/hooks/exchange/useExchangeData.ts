import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectTradingExchangeLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';

import { getRandomAccountDescriptor } from '../../utils/general/utils';

export const useExchangeData = (reloadRequestOrdinal: number) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(
            tradingThunks.loadInitialDataThunk({
                activeSection: 'exchange',
                forcedApiKey: getRandomAccountDescriptor(),
            }),
        );
    }, [dispatch, reloadRequestOrdinal]);

    return useSelector(selectTradingExchangeLoadingTimestampAndStatus);
};
