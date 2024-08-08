import { useEffect } from 'react';
import { loadInvityData } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { useDispatch } from 'src/hooks/suite';

export const useCoinmarketLoadData = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(loadInvityData());
    }, [dispatch]);
};
