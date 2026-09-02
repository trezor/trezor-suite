import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import {
    selectTradingSellActiveTrade,
    selectTradingSellIsFromRedirect,
    selectTradingSellQuotesRequest,
    selectTradingSellTransactionId,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';

export const useTradingSellConfirm = () => {
    const dispatch = useDispatch();

    useServerEnvironment();

    const trade = useSelector(selectTradingSellActiveTrade);
    const quotesRequest = useSelector(selectTradingSellQuotesRequest);
    const isFromRedirect = useSelector(selectTradingSellIsFromRedirect);
    const transactionId = useSelector(selectTradingSellTransactionId);

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
};
