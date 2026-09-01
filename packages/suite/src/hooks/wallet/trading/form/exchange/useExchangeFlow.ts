import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingTransactionExchange,
    tradingExchangeActions,
    tradingThunks,
} from '@suite-common/trading';

import { useTradingClearStaleQuotes } from '../common/useTradingClearStaleQuotes';

type UseExchangeFlowProps = {
    isFromRedirect: boolean;
    trade: TradingTransactionExchange | undefined;
    transactionId: string | undefined;
    isAmountEmpty: boolean;
};

export const useExchangeFlow = ({
    isFromRedirect,
    trade,
    transactionId,
    isAmountEmpty,
}: UseExchangeFlowProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'exchange' }));
    }, [dispatch]);

    useTradingClearStaleQuotes({ type: 'exchange', isAmountEmpty });

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
