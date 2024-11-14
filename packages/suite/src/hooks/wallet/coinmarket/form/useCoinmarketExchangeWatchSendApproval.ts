import { useEffect, useState } from 'react';
import { useTimeoutFn, useUnmount } from 'react-use';

import { ExchangeTrade } from 'invity-api';

import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useDispatch } from 'src/hooks/suite';
import { saveSelectedQuote } from 'src/actions/wallet/coinmarketExchangeActions';

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

            if (response.status && response.status !== selectedQuote.status) {
                const updatedSelectedQuote = {
                    ...selectedQuote,
                    status: response.status,
                    error: response.error,
                    approvalType: undefined,
                };

                dispatch(saveSelectedQuote(updatedSelectedQuote));

                if (selectedQuote.dexTx) {
                    await confirmTrade(selectedQuote.dexTx.from, undefined, updatedSelectedQuote);
                }
            }

            resetRefresh();
        };

        watchTradeAsync();
    }, [refreshCount, selectedQuote, cancelRefresh, resetRefresh, dispatch, confirmTrade]);
};
