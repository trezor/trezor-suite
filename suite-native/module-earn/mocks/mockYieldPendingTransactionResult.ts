import { type useYieldPendingTransaction } from '../src/hooks/yield/useYieldPendingTransaction';

type YieldPendingTransactionResult = ReturnType<typeof useYieldPendingTransaction>;

export const mockYieldPendingTransactionResult = (
    overrides: Partial<YieldPendingTransactionResult> = {},
): YieldPendingTransactionResult => ({
    displayedPendingTransaction: undefined,
    isSheetPresented: false,
    pendingBottomSheetRef: { current: null },
    pendingModalProps: null,
    pendingTransaction: undefined,
    ...overrides,
});
