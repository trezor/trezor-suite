import { useCallback, useEffect } from 'react';

import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useBottomSheetModal } from '@suite-native/atoms';
import { useTransactionDetails } from '@suite-native/transaction-management';

type YieldPendingTransactionType = Exclude<YieldPendingTransactionState['type'], 'revoke-only'>;

type UseYieldPendingTransactionParams = {
    accountKey: AccountKey | null | undefined;
    isFocused: boolean;
    pendingTransaction: YieldPendingTransactionState | null | undefined;
    transactionType: YieldPendingTransactionType;
};

const getPendingTransactionByType = (
    pendingTransaction: YieldPendingTransactionState | null | undefined,
    transactionType: YieldPendingTransactionType,
) => {
    if (!pendingTransaction) {
        return undefined;
    }

    if (transactionType === 'revoke') {
        return pendingTransaction.type === 'revoke' || pendingTransaction.type === 'revoke-only'
            ? pendingTransaction
            : undefined;
    }

    return pendingTransaction.type === transactionType ? pendingTransaction : undefined;
};

export const useYieldPendingTransaction = ({
    accountKey,
    isFocused,
    pendingTransaction,
    transactionType,
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
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: accountKey ?? null,
        txid: matchingPendingTransaction?.txid ?? null,
    });
    const pendingModalProps =
        matchingPendingTransaction !== undefined
            ? {
                  fee: matchingPendingTransaction.fee,
                  isExploreDisabled: !explorerUrl,
                  onExplorePress: openInBlockchain,
                  submittedAt: new Date(matchingPendingTransaction.submittedAt ?? 0),
              }
            : null;

    useEffect(() => {
        if (!isFocused || matchingPendingTransaction === undefined) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, matchingPendingTransaction, openPendingBottomSheet]);

    const reopenPendingBottomSheet = useCallback(() => {
        if (matchingPendingTransaction !== undefined) {
            requestAnimationFrame(openPendingBottomSheet);
        }
    }, [matchingPendingTransaction, openPendingBottomSheet]);

    return {
        pendingBottomSheetRef,
        pendingModalProps,
        pendingTransaction: matchingPendingTransaction,
        reopenPendingBottomSheet,
    };
};
