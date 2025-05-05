import { useEffect, useState } from 'react';
import { useTimeoutFn, useUnmount } from 'react-use';

import { ExchangeTrade } from 'invity-api';

import { useDispatch } from 'src/hooks/suite';
import { TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';

interface TradingUseExchangeWatchSendApprovalProps {
    selectedQuote?: ExchangeTrade;
    watchTradeApproval: TradingExchangeFormContextProps['watchTradeApproval'];
}

/**
 * sub-hook used for watch and confirming selected trade
 * used in for TradingOfferExchangeSendApproval
 */
export const useTradingExchangeWatchSendApproval = ({
    selectedQuote,
    watchTradeApproval,
}: TradingUseExchangeWatchSendApprovalProps) => {
    const REFRESH_SECONDS = 15;
    const shouldRefresh = (quote?: ExchangeTrade) => quote?.status === 'APPROVAL_PENDING';

    const dispatch = useDispatch();
    const [refreshCount, setRefreshCount] = useState(0);
    const invokeRefresh = () => {
        if (shouldRefresh(selectedQuote)) {
            setRefreshCount(prevValue => prevValue + 1);
        }
    };
    const [, cancelRefresh, resetRefresh] = useTimeoutFn(invokeRefresh, REFRESH_SECONDS * 1000);

    useUnmount(() => {
        cancelRefresh();
    });

    // watch the trade and update transaction
    useEffect(() => {
        if (!selectedQuote || !shouldRefresh(selectedQuote)) return;

        const watchTradeAsync = async () => {
            cancelRefresh();
            await watchTradeApproval(refreshCount);
            resetRefresh();
        };

        watchTradeAsync();
    }, [refreshCount, selectedQuote, cancelRefresh, resetRefresh, dispatch, watchTradeApproval]);
};
