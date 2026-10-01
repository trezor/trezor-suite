import { useWrapStepWarningsContext } from '../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';

/**
 * Whether the amount warnings of the wrap step apply. They stay hidden while the wrap is pending or
 * the amount has invalid decimals, and while the balance does not cover the fee reserve, since
 * nothing can be wrapped then and the fee reserve warning is shown instead.
 */
export const useShouldCheckWrapAmount = (): boolean => {
    const { amountIssues, nativeFeeStatus, hasPendingTransaction } = useWrapStepWarningsContext();

    return (
        !hasPendingTransaction &&
        !amountIssues.includes('amount-invalid-decimals') &&
        nativeFeeStatus !== 'insufficient'
    );
};
