import {
    type FeeReserveNotice,
    useFeeReserveNotice,
} from 'src/components/earn/yield/deposit/YieldDepositForm/hooks/useFeeReserveNotice';

import { useActionStepWarningsContext } from '../../ActionStepWarningsContext/hooks/useActionStepWarningsContext';
import { useShouldCheckActionStepWarnings } from '../../hooks/useShouldCheckActionStepWarnings';

export const useInsufficientFeeReserveWarning = (): FeeReserveNotice | null => {
    const { networkSymbol, gasReserve, nativeFeeStatus } = useActionStepWarningsContext();
    const shouldCheckActionStepWarnings = useShouldCheckActionStepWarnings();
    // The deposit step only blocks below the minimum reserve, so that is the threshold it quotes.
    const reserveNotice = useFeeReserveNotice({ networkSymbol, reserve: gasReserve.minimum });

    return shouldCheckActionStepWarnings && nativeFeeStatus === 'insufficient'
        ? reserveNotice
        : null;
};
