import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useApproveStepWarningsContext } from '../../ApproveStepWarningsContext/hooks/useApproveStepWarningsContext';
import { useIsApproveOverBalance } from '../../hooks/useIsApproveOverBalance';

export const useFeeReserveTopUpWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, gasReserve, nativeFeeStatus, hasPendingTransaction } =
        useApproveStepWarningsContext();
    const isApproveOverBalance = useIsApproveOverBalance();
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve: gasReserve.recommended });

    // A single banner fits the step, and the over-balance note goes first.
    const isVisible =
        !hasPendingTransaction && !isApproveOverBalance && nativeFeeStatus === 'below-recommended';

    return isVisible ? reserveNotice : null;
};
