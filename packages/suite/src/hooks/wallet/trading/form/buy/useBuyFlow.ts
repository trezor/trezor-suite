import { useEffect } from 'react';

import { goto } from '@suite/router';
import { type selectTradingBuyQuotesRequest, tradingThunks } from '@suite-common/trading';

import { useDispatch } from 'src/hooks/suite';

import { useTradingClearStaleQuotes } from '../common/useTradingClearStaleQuotes';

type UseBuyFlowProps = {
    isFromRedirect: boolean;
    quotesRequest: ReturnType<typeof selectTradingBuyQuotesRequest>;
    isAmountEmpty: boolean;
};

export const useBuyFlow = ({ isFromRedirect, quotesRequest, isAmountEmpty }: UseBuyFlowProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'buy' }));
    }, [dispatch]);

    useTradingClearStaleQuotes({ type: 'buy', isAmountEmpty });

    useEffect(() => {
        if (isFromRedirect && quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-buy-confirm' }));
        }
    }, [isFromRedirect, quotesRequest, dispatch]);
};
