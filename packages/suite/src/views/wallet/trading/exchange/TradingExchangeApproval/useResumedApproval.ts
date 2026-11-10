import { useState } from 'react';

import type { ExchangeTrade } from 'invity-api';

import { useDidUpdate, usePreviousDefined } from '@trezor/react-utils';

import { type useExchangeApproval } from '../../../../../hooks/wallet/trading/form/exchange/useExchangeApproval';

type UseResumedApprovalParams = {
    quote: ExchangeTrade | undefined;
    pendingApprovalTxid: string | undefined;
    confirmApproval: ReturnType<typeof useExchangeApproval>['confirmApproval'];
};

export const useResumedApproval = ({
    quote,
    pendingApprovalTxid,
    confirmApproval,
}: UseResumedApprovalParams) => {
    const previousTxid = usePreviousDefined(pendingApprovalTxid);
    const [isConfirming, setIsConfirming] = useState(false);

    useDidUpdate(() => {
        if (
            pendingApprovalTxid ||
            !previousTxid ||
            quote?.status === 'APPROVAL_PENDING' ||
            !quote?.receiveAddress
        ) {
            return;
        }

        setIsConfirming(true);
        confirmApproval({ trade: quote, receiveAddress: quote.receiveAddress }).finally(() =>
            setIsConfirming(false),
        );
    }, [pendingApprovalTxid]);

    return {
        isConfirming,
        txid: pendingApprovalTxid ?? (isConfirming ? previousTxid : undefined),
    };
};
