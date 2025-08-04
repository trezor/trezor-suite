import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    selectTradingExchangeLoadingTimestampAndStatus,
    tradingThunks,
} from '@suite-common/trading';

import { selectExchangeSelectedSendAccount } from '../../selectors/exchangeSelectors';
import { getRandomAccountDescriptor } from '../../utils/general/utils';

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
