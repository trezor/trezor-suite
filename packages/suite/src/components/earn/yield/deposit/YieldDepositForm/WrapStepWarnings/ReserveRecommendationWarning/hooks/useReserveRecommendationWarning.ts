import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useWrapStepWarningsContext } from '../../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';
import { useWrapReserveStatus } from '../../hooks/useWrapReserveStatus';

/** Wrapping into the reserve stays allowed, so eating into it only gets a recommendation. */
export const useReserveRecommendationWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, reserve } = useWrapStepWarningsContext();
    const wrapReserveStatus = useWrapReserveStatus();
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve });

    return wrapReserveStatus === 'below' ? reserveNotice : null;
};
