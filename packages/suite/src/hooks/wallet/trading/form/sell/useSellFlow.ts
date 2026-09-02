import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type TradingTransactionSell,
    tradingSellActions,
    tradingThunks,
} from '@suite-common/trading';

import { useTradingClearStaleQuotes } from '../common/useTradingClearStaleQuotes';

type UseSellFlowProps = {
    isFromRedirect: boolean;
    trade: TradingTransactionSell | undefined;
    transactionId: string | undefined;
    isAmountEmpty: boolean;
};

export const useSellFlow = ({
    isFromRedirect,
    trade,
    transactionId,
    isAmountEmpty,
}: UseSellFlowProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: 'sell' }));
    }, [dispatch]);

    useTradingClearStaleQuotes({ type: 'sell', isAmountEmpty });

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
