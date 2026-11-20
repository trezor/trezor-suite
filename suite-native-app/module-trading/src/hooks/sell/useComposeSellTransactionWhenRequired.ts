import { useEffect, useRef } from 'react';

import type { SellTradeStatus } from 'invity-api';

type UseComposeSellTransactionWhenRequiredProps = {
    orderId: string | undefined;
    status: SellTradeStatus | undefined;
    composeTradingTransaction: () => void;
};

export const useComposeSellTransactionWhenRequired = ({
    orderId,
    status,
    composeTradingTransaction,
}: UseComposeSellTransactionWhenRequiredProps) => {
    const composedOrderIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (status === 'SEND_CRYPTO' && orderId !== composedOrderIdRef.current) {
            composedOrderIdRef.current = orderId;
            composeTradingTransaction();
        }
    }, [orderId, status, composeTradingTransaction]);
};
