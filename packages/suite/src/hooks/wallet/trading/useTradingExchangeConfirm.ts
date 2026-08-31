import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { goto } from '@suite/router';
import { useSelector } from '@suite-common/redux-utils';
import {
    selectTradingExchangeActiveTrade,
    selectTradingExchangeIsFromRedirect,
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeTransactionId,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';
export const useTradingExchangeConfirm = () => {
    const dispatch = useDispatch();

    const trade = useSelector(selectTradingExchangeActiveTrade);
    const quotesRequest = useSelector(selectTradingExchangeQuotesRequest);
    const isFromRedirect = useSelector(selectTradingExchangeIsFromRedirect);
    const transactionId = useSelector(selectTradingExchangeTransactionId);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'exchange' }));
    }, [dispatch]);

    useEffect(() => {
        if (!quotesRequest) {
            dispatch(goto({ routeName: 'wallet-trading-exchange' }));
        }
    }, [quotesRequest, dispatch]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingExchangeActions.saveSelectedQuote(trade.data));
                dispatch(tradingExchangeActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingExchangeActions.setTradingAccountKey(trade.sendAccountKey));
                }
            }

            dispatch(tradingExchangeActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, dispatch]);
};
