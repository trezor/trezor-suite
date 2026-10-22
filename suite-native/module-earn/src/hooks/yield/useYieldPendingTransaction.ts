import { useEffect } from 'react';

import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';

import { useYieldPendingSheet } from './useYieldPendingSheet';
import { useYieldPendingTransactionDetails } from './useYieldPendingTransactionDetails';

type YieldPendingTransactionType = YieldPendingTransactionState['type'];

type UseYieldPendingTransactionParams = {
    accountKey: AccountKey | null | undefined;
    isFocused: boolean;
    pendingTransaction: YieldPendingTransactionState | null | undefined;
    transactionType: YieldPendingTransactionType;
    vaultId?: string;
};

const getPendingTransactionByType = (
    pendingTransaction: YieldPendingTransactionState | null | undefined,
    transactionType: YieldPendingTransactionType,
) => {
    if (!pendingTransaction) {
        return undefined;
    }

    return pendingTransaction.type === transactionType ? pendingTransaction : undefined;
};

export const useYieldPendingTransaction = ({
    accountKey,
    isFocused,
    pendingTransaction,
    transactionType,
    vaultId,
}: UseYieldPendingTransactionParams) => {
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();
    const matchingPendingTransaction = getPendingTransactionByType(
        pendingTransaction,
        transactionType,
    );
    const { displayedPendingTransaction, isSheetPresented, handleSheetDismissed } =
        useYieldPendingSheet(matchingPendingTransaction);
    const { explorerUrl, openInBlockchain } = useYieldPendingTransactionDetails({
        accountKey: accountKey ?? null,
        txid: displayedPendingTransaction?.txid ?? null,
        transactionType: displayedPendingTransaction?.type,
        vaultId,
    });
    // Built from the retained transaction so the sheet keeps its values while it dismisses.
    const pendingModalProps =
        displayedPendingTransaction !== undefined
            ? {
                  fee: displayedPendingTransaction.fee,
                  isExploreDisabled: !explorerUrl,
                  onDismiss: handleSheetDismissed,
                  onExplorePress: openInBlockchain,
                  submittedAt: new Date(displayedPendingTransaction.submittedAt ?? 0),
                  txid: displayedPendingTransaction.txid,
              }
            : null;

    useEffect(() => {
        if (!isFocused || matchingPendingTransaction === undefined) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, matchingPendingTransaction, openPendingBottomSheet]);

    return {
        displayedPendingTransaction,
        isSheetPresented,
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: matchingPendingTransaction,
    };
};
