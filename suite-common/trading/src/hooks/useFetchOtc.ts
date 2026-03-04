import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { getWeakRandomId } from '@trezor/utils';

import { invityAPI } from '../invityAPI';
import { useSelector } from './useSelector';
import { tradingActions } from '../reducers/tradingCommonReducer';
import { selectTradingOtc } from '../selectors/tradingSelectors';

const FALLBACK_API_KEY = getWeakRandomId(20);

export const useFetchOtc = () => {
    const dispatch = useDispatch();
    const otc = useSelector(selectTradingOtc);
    const [isLoading, setIsLoading] = useState(false);

    const fetchOtc = useCallback(async () => {
        if (!invityAPI.getCurrentApiKey()) {
            invityAPI.createInvityAPIKey(FALLBACK_API_KEY);
        }

        setIsLoading(true);
        try {
            const response = await invityAPI.getOTCData();
            if (!response) {
                return false;
            }

            dispatch(tradingActions.saveOtc(response));

            return true;
        } catch (error) {
            console.error('Failed to fetch OTC data', error);

            return false;
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        void fetchOtc();
    }, [fetchOtc]);

    return { data: otc, isLoading, refetch: fetchOtc };
};
