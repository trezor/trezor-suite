import { useEffect } from 'react';

import { type AccountKey } from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useTransactionDetails } from '@suite-native/transaction-management';

type UseEarnPendingTransactionSheetParams = {
    accountKey: AccountKey;
    isPending: boolean;
    pendingTxid: string | undefined;
};

export const useEarnPendingTransactionSheet = ({
    accountKey,
    isPending,
    pendingTxid,
}: UseEarnPendingTransactionSheetParams) => {
    const { bottomSheetRef: pendingBottomSheetRef, openModal: openPendingBottomSheet } =
        useBottomSheetModal();

    useEffect(() => {
        if (isPending) {
            openPendingBottomSheet();
        }
    }, [isPending, openPendingBottomSheet]);

    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid: pendingTxid ?? null,
    });

    return {
        pendingBottomSheetRef,
        isExploreDisabled: !explorerUrl,
        openInBlockchain,
    };
};
