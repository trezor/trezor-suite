import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useActionStepWarningsContext } from '../../ActionStepWarningsContext/hooks/useActionStepWarningsContext';
import { useShouldCheckActionStepWarnings } from '../../hooks/useShouldCheckActionStepWarnings';

export const useFeeReserveTopUpWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, gasReserve, nativeFeeStatus, isApprovalInsufficient, amountIssues } =
        useActionStepWarningsContext();
    const shouldCheckActionStepWarnings = useShouldCheckActionStepWarnings();
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve: gasReserve.recommended });

    // A non-blocking recommendation, so it gives way to the allowance and amount warnings.
    const isVisible =
        shouldCheckActionStepWarnings &&
        nativeFeeStatus === 'below-recommended' &&
        !isApprovalInsufficient &&
        !amountIssues.includes('amount-too-high');

    return isVisible ? reserveNotice : null;
};
