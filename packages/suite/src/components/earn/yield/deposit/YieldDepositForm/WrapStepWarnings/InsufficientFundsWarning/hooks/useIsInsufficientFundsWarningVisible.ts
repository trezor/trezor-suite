import { useWrapStepWarningsContext } from '../../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';
import { useShouldCheckWrapAmount } from '../../hooks/useShouldCheckWrapAmount';

export const useIsInsufficientFundsWarningVisible = (): boolean => {
    const { amountIssues } = useWrapStepWarningsContext();
    const shouldCheckWrapAmount = useShouldCheckWrapAmount();

    return shouldCheckWrapAmount && amountIssues.includes('amount-too-high');
};
