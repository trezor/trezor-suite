import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { clamp } from '@trezor/utils';

import { TRADE_API_RELOAD_QUOTES_AFTER_SECONDS } from '../constants';
import { useSelector } from './useSelector';
import { tradingActions } from '../reducers/tradingCommonReducer';
import { selectTradingQuoteRefetchingState } from '../selectors/tradingSelectors';

type UseTradingRefetchSchedulerProps = {
    onRefetch: () => void;
};

export const useTradingRefetchScheduler = ({ onRefetch }: UseTradingRefetchSchedulerProps) => {
    const dispatch = useDispatch();
    const { lastFetchTimestamp, status } = useSelector(selectTradingQuoteRefetchingState);
    const onRefetchRef = useRef(onRefetch);
    onRefetchRef.current = onRefetch;

    useEffect(() => {
        if (status !== 'running' || !lastFetchTimestamp) return;
        const elapsed = Date.now() - lastFetchTimestamp;
        const delay = clamp(Math.max(TRADE_API_RELOAD_QUOTES_AFTER_SECONDS * 1000 - elapsed, 0));
        const id = setTimeout(() => {
            onRefetchRef.current();
        }, delay);

        return () => clearTimeout(id);
    }, [lastFetchTimestamp, status]);

    useEffect(
        () => () => {
            dispatch(tradingActions.stopRefetchQuotes());
        },
        [dispatch],
    );
};
