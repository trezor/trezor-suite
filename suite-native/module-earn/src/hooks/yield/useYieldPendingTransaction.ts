import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type TransactionsRootState,
    type YieldPendingTransactionState,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
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
    trackedTxid?: string | null;
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
    trackedTxid,
    vaultId,
}: UseYieldPendingTransactionParams) => {
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();
    const replacementTxid =
        pendingTransaction && trackedTxid !== pendingTransaction.txid ? trackedTxid : undefined;
    const replacementFee = useSelector((state: TransactionsRootState) =>
        accountKey && replacementTxid
            ? selectTransactionByAccountKeyAndTxid(state, accountKey, replacementTxid)?.fee
            : undefined,
    );
    const matchingPendingTransaction = useMemo(() => {
        const transaction = getPendingTransactionByType(pendingTransaction, transactionType);

        return transaction && replacementTxid
            ? { ...transaction, txid: replacementTxid, fee: replacementFee }
            : transaction;
    }, [pendingTransaction, replacementFee, replacementTxid, transactionType]);
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

    const hasPendingTransaction = matchingPendingTransaction !== undefined;

    useEffect(() => {
        if (!isFocused || !hasPendingTransaction) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, hasPendingTransaction, openPendingBottomSheet]);

    return {
        displayedPendingTransaction,
        isSheetPresented,
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: matchingPendingTransaction,
    };
};
