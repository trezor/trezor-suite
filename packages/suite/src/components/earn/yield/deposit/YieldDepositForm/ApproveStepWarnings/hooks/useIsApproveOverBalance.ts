import { useApproveStepWarningsContext } from '../ApproveStepWarningsContext/hooks/useApproveStepWarningsContext';

/**
 * Approving more than the balance is allowed and only noted. A balance that does not cover the fee
 * reserve blocks the step, so its warning is shown instead.
 */
export const useIsApproveOverBalance = (): boolean => {
    const { amountIssues, nativeFeeStatus, hasPendingTransaction } =
        useApproveStepWarningsContext();

    return (
        !hasPendingTransaction &&
        nativeFeeStatus !== 'insufficient' &&
        !amountIssues.includes('amount-invalid-decimals') &&
        amountIssues.includes('amount-too-high')
    );
};
