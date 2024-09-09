import { ExchangeTrade } from 'invity-api';
import { useEffect, useState } from 'react';
import { useTimeoutFn, useUnmount } from 'react-use';
import { useDispatch } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';

interface CoinmarketUseExchangeWatchSendApprovalProps {
    selectedQuote?: ExchangeTrade;
    confirmTrade: (address: string, extraField?: string, trade?: ExchangeTrade) => Promise<boolean>;
}

/**
 * sub-hook used for watch and confirming selected trade
 * used in for CoinmarketOfferExchangeSendApproval
 */
export const useCoinmarketExchangeWatchSendApproval = ({
    selectedQuote,
    confirmTrade,
}: CoinmarketUseExchangeWatchSendApprovalProps) => {
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

            const response = await invityAPI.watchTrade<CoinmarketTradeExchangeType>(
                selectedQuote,
                'exchange',
                refreshCount,
            );

            if (!selectedQuote.dexTx) return;
            if (!response.status || response.status === selectedQuote.status) return;

            await confirmTrade(selectedQuote.dexTx.from, undefined, {
                ...selectedQuote,
                status: response.status,
                error: response.error,
                approvalType: undefined,
            });

            resetRefresh();
        };

        watchTradeAsync();
    }, [refreshCount, selectedQuote, cancelRefresh, confirmTrade, resetRefresh, dispatch]);
};
