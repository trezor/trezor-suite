import { useActionStepWarningsContext } from '../../ActionStepWarningsContext/hooks/useActionStepWarningsContext';
import { useShouldCheckActionStepWarnings } from '../../hooks/useShouldCheckActionStepWarnings';

export const useIsApprovalTooLowWarningVisible = (): boolean => {
    const { nativeFeeStatus, isApprovalInsufficient } = useActionStepWarningsContext();
    const shouldCheckActionStepWarnings = useShouldCheckActionStepWarnings();

    return (
        shouldCheckActionStepWarnings &&
        nativeFeeStatus !== 'insufficient' &&
        isApprovalInsufficient
    );
};
