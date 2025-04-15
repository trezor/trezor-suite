import { useEffect, useState } from 'react';
import { useTimeoutFn, useUnmount } from 'react-use';

import { ExchangeTrade } from 'invity-api';

import { type TradingExchangeType, invityAPI } from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';

import { useDispatch } from 'src/hooks/suite';
import { TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';

interface TradingUseExchangeWatchSendApprovalProps {
    selectedQuote?: ExchangeTrade;
    confirmTrade: TradingExchangeFormContextProps['confirmTrade'];
}

/**
 * sub-hook used for watch and confirming selected trade
 * used in for TradingOfferExchangeSendApproval
 */
export const useTradingExchangeWatchSendApproval = ({
    selectedQuote,
    confirmTrade,
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

            // TODO: trading - could be moved to suite-common
            const response = await invityAPI.watchTrade<TradingExchangeType>(
                selectedQuote,
                'exchange',
                refreshCount,
            );

            if (response.status && response.status !== selectedQuote.status) {
                const updatedSelectedQuote = {
                    ...selectedQuote,
                    status: response.status,
                    error: response.error,
                    approvalType: undefined,
                };

                dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

                if (selectedQuote.dexTx && selectedQuote.receiveAddress) {
                    await confirmTrade({
                        receiveAddress: selectedQuote.receiveAddress,
                        trade: updatedSelectedQuote,
                    });
                }
            }

            resetRefresh();
        };

        watchTradeAsync();
    }, [refreshCount, selectedQuote, cancelRefresh, resetRefresh, dispatch, confirmTrade]);
};
