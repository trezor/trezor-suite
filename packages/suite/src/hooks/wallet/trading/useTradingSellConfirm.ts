import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { gotoThunk } from '@suite/router';
import {
    selectTradingSellActiveTrade,
    selectTradingSellIsFromRedirect,
    selectTradingSellIsLoading,
    selectTradingSellQuotesRequest,
    selectTradingSellSelectedQuote,
    selectTradingSellTransactionId,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { requestSellTradeThunk } from 'src/actions/wallet/trading/sell/requestSellTradeThunk';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';

export const useTradingSellConfirm = () => {
    const { dispatch } = useServices(injectDispatch);

    useServerEnvironment();

    const trade = useSelector(selectTradingSellActiveTrade);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const isLoading = useSelector(selectTradingSellIsLoading);

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'sell' }));
    }, [dispatch]);

    useEffect(() => {
        if (!quotesRequest) {
            dispatch(gotoThunk({ routeName: 'wallet-trading-sell' }));
        }
    }, [quotesRequest, dispatch]);

    useEffect(() => {
        if (isFromRedirect) {
            if (transactionId && trade) {
                dispatch(tradingSellActions.saveSelectedQuote(trade.data));
                dispatch(tradingSellActions.setFormStep('SEND_TRANSACTION'));
                if (trade.sendAccountKey) {
                    dispatch(tradingSellActions.setTradingAccountKey(trade.sendAccountKey));
                }
            }

            dispatch(tradingSellActions.setIsFromRedirect(false));
        }
    }, [isFromRedirect, trade, transactionId, dispatch]);

    const isRequestDisabled = isLoading || !selectedQuote;

    const requestTrade = async () => {
        if (!selectedQuote) return;

        await dispatch(requestSellTradeThunk({ quote: selectedQuote }));
    };

    return { requestTrade, isRequestDisabled };
};
