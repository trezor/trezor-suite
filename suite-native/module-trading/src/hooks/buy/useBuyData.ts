import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectTradingBuyLoadingTimestampAndStatus, tradingThunks } from '@suite-common/trading';

import { selectBuySelectedReceiveAccount } from '../../selectors/buySelectors';
import { getRandomAccountDescriptor } from '../../utils/general/utils';

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
