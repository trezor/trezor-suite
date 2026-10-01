import { useActionStepWarningsContext } from '../ActionStepWarningsContext/hooks/useActionStepWarningsContext';

/** No warning of the deposit step applies while it is pending or the amount has invalid decimals. */
export const useShouldCheckActionStepWarnings = (): boolean => {
    const { amountIssues, hasPendingTransaction } = useActionStepWarningsContext();

    return !hasPendingTransaction && !amountIssues.includes('amount-invalid-decimals');
};
