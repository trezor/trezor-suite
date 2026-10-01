import { useActionStepWarningsContext } from '../../ActionStepWarningsContext/hooks/useActionStepWarningsContext';
import { useShouldCheckActionStepWarnings } from '../../hooks/useShouldCheckActionStepWarnings';

export const useIsInsufficientFundsWarningVisible = (): boolean => {
    const { amountIssues, nativeFeeStatus, isApprovalInsufficient } =
        useActionStepWarningsContext();
    const shouldCheckActionStepWarnings = useShouldCheckActionStepWarnings();

    return (
        shouldCheckActionStepWarnings &&
        nativeFeeStatus !== 'insufficient' &&
        !isApprovalInsufficient &&
        amountIssues.includes('amount-too-high')
    );
};
