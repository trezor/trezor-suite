import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useWrapStepWarningsContext } from '../../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';

export const useInsufficientFeeReserveWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, reserve, nativeFeeStatus, hasPendingTransaction } =
        useWrapStepWarningsContext();
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve });

    return !hasPendingTransaction && nativeFeeStatus === 'insufficient' ? reserveNotice : null;
};
