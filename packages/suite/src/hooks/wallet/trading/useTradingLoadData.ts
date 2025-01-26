import { useEffect } from 'react';

import { loadInvityData } from 'src/actions/wallet/trading/tradingCommonActions';
import { useDispatch } from 'src/hooks/suite';

export const useTradingLoadData = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);
};
