import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useWrapStepWarningsContext } from '../../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';
import { useWrapReserveStatus } from '../../hooks/useWrapReserveStatus';

export const useReserveKeptWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, reserve } = useWrapStepWarningsContext();
    const wrapReserveStatus = useWrapReserveStatus();
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve });

    return wrapReserveStatus === 'kept' ? reserveNotice : null;
};
