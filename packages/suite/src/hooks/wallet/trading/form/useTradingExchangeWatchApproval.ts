import { useEffect, useRef, useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { type TradingExchangeFormContextProps } from 'src/types/trading/tradingForm';

interface TradingExchangeWatchApprovalProps {
    selectedQuote?: ExchangeTrade;
    watchApproval: TradingExchangeFormContextProps['watchApproval'];
}

export const useTradingExchangeWatchApproval = ({
    selectedQuote,
    watchApproval,
}: TradingExchangeWatchApprovalProps) => {
    const POLLING_TIME = 5000;

    const timeoutRef = useRef<number | undefined>(undefined);
    const [isScheduled, setIsScheduled] = useState<boolean>(false);
    const [refreshCount, setRefreshCount] = useState(1);

    useEffect(() => {
        if (selectedQuote && selectedQuote.status === 'APPROVAL_PENDING' && !isScheduled) {
            const poll = async () => {
                await watchApproval({ refreshCount });
                setRefreshCount(prev => prev + 1);
                setIsScheduled(false);
            };

            timeoutRef.current = setTimeout(() => poll(), POLLING_TIME);
            setIsScheduled(true);
        } else if (!isScheduled) {
            setRefreshCount(1);
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    }, [selectedQuote, watchApproval, isScheduled, refreshCount]);
};
