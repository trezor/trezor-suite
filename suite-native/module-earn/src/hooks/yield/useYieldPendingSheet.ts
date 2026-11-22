import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type TransactionsRootState,
    type YieldPendingTransactionState,
    selectAccountTransactions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { findTrackedEvmTransaction } from '@suite-common/wallet-utils';
import { useBottomSheetModal } from '@suite-native/atoms';
import { usePreviousDefined } from '@trezor/react-utils';

import { useEarnMissingTransaction } from '../earn/useEarnMissingTransaction';

// Generous next to the ~250ms dismissal: this only backstops a dismissal that never reports.
const SHEET_DISMISS_TIMEOUT_MS = 1_000;

type UseYieldPendingSheetParams = {
    pendingTransaction: YieldPendingTransactionState | undefined;
    accountKey: AccountKey | null | undefined;
    isFocused: boolean;
};

/**
 * Sequences the pending-transaction sheet against the flow step that replaces the screen under it.
 *
 * `completeAction` clears the pending transaction and advances the step in a single reducer, so the
 * sheet starts dismissing in the very commit that would replace the screen. @gorhom/bottom-sheet
 * does not drop a still-open sheet's native views on unmount — the portal holds them while it
 * animates closed — so replacing the screen in that window corrupts the native view tree and
 * crashes Fabric with "addViewAt: failed to insert view".
 *
 * Callers keep the sheet rendered from `displayedPendingTransaction`, hold their
 * `navigation.replace` while `isSheetPresented`, and pass `handleSheetDismissed` to the sheet.
 */
export const useYieldPendingSheet = ({
    pendingTransaction,
    accountKey,
    isFocused,
}: UseYieldPendingSheetParams) => {
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal,
    } = useBottomSheetModal();
    const txid = pendingTransaction?.txid;
    const nonce = pendingTransaction?.nonce;
    const hasTrackedTransaction = useSelector((state: TransactionsRootState) =>
        txid && accountKey
            ? !!findTrackedEvmTransaction({
                  transactions: selectAccountTransactions(state, accountKey),
                  txid,
                  nonce,
              })
            : false,
    );
    const isMissing = useEarnMissingTransaction({
        txid: accountKey ? txid : undefined,
        submittedAt: pendingTransaction?.submittedAt,
        hasTrackedTransaction,
        isFocused,
    });

    // Keep the session's pending transaction and submission guards while releasing its sheet.
    const visiblePendingTransaction = isMissing ? undefined : pendingTransaction;
    const previousPendingTransaction = usePreviousDefined(visiblePendingTransaction);
    const isPendingSheetVisible = isFocused && !!visiblePendingTransaction;
    const [isSheetPresented, setIsSheetPresented] = useState(false);

    const openPendingBottomSheet = useCallback(() => {
        setIsSheetPresented(true);
        openModal();
    }, [openModal]);

    useEffect(() => {
        if (!isPendingSheetVisible) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isPendingSheetVisible, openPendingBottomSheet]);

    // The sheet may never report its dismissal — it is only opened while the screen is focused, and
    // the portal owns the teardown either way. Without this the flow strands the user on a finished
    // transaction.
    useEffect(() => {
        if (!isSheetPresented || isPendingSheetVisible) {
            return undefined;
        }

        const timeout = setTimeout(() => setIsSheetPresented(false), SHEET_DISMISS_TIMEOUT_MS);

        return () => clearTimeout(timeout);
    }, [isPendingSheetVisible, isSheetPresented]);

    const handleSheetDismissed = useCallback(() => setIsSheetPresented(false), []);

    return {
        // Keeps the sheet's values after the store clears them, so it can stay rendered while it
        // dismisses rather than vanishing mid-animation.
        displayedPendingTransaction: visiblePendingTransaction ?? previousPendingTransaction,
        pendingBottomSheetRef,
        openPendingBottomSheet,
        isPendingSheetVisible,
        isSheetPresented,
        handleSheetDismissed,
    };
};
