import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useApproveStepWarningsContext } from '../../ApproveStepWarningsContext/hooks/useApproveStepWarningsContext';

export const useInsufficientFeeReserveWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, gasReserve, nativeFeeStatus, hasPendingTransaction } =
        useApproveStepWarningsContext();
    // The approve step only blocks below the minimum reserve, so that is the threshold it quotes.
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve: gasReserve.minimum });

    return !hasPendingTransaction && nativeFeeStatus === 'insufficient' ? reserveNotice : null;
};
