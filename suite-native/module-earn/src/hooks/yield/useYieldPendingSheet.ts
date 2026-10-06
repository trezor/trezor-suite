import { useCallback, useEffect, useState } from 'react';

import { type YieldPendingTransactionState } from '@suite-common/wallet-core';
import { usePreviousDefined } from '@trezor/react-utils';

// Generous next to the ~250ms dismissal: this only backstops a dismissal that never reports.
const SHEET_DISMISS_TIMEOUT_MS = 1_000;

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
export const useYieldPendingSheet = (
    actionPendingTransaction: YieldPendingTransactionState | undefined,
) => {
    const previousPendingTransaction = usePreviousDefined(actionPendingTransaction);
    const isPending = !!actionPendingTransaction;
    const [isSheetPresented, setIsSheetPresented] = useState(false);

    useEffect(() => {
        if (isPending) {
            setIsSheetPresented(true);
        }
    }, [isPending]);

    // The sheet may never report its dismissal — it is only opened while the screen is focused, and
    // the portal owns the teardown either way. Without this the flow strands the user on a finished
    // transaction.
    useEffect(() => {
        if (!isSheetPresented || isPending) {
            return undefined;
        }

        const timeout = setTimeout(() => setIsSheetPresented(false), SHEET_DISMISS_TIMEOUT_MS);

        return () => clearTimeout(timeout);
    }, [isPending, isSheetPresented]);

    const handleSheetDismissed = useCallback(() => setIsSheetPresented(false), []);

    return {
        // Keeps the sheet's values after the store clears them, so it can stay rendered while it
        // dismisses rather than vanishing mid-animation.
        displayedPendingTransaction: actionPendingTransaction ?? previousPendingTransaction,
        isSheetPresented,
        handleSheetDismissed,
    };
};
