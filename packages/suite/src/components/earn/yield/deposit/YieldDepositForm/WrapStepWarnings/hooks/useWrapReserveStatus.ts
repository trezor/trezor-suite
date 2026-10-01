import { type WrapReserveStatus, getWrapReserveStatus } from '@suite-common/wallet-core';

import { useShouldCheckWrapAmount } from './useShouldCheckWrapAmount';
import { useWrapStepWarningsContext } from '../WrapStepWarningsContext/hooks/useWrapStepWarningsContext';

export const useWrapReserveStatus = (): WrapReserveStatus => {
    const { amount, amountIssues, nativeBalance, reserve } = useWrapStepWarningsContext();
    const shouldCheckWrapAmount = useShouldCheckWrapAmount();

    // An amount above the balance gets the insufficient funds warning instead.
    if (!shouldCheckWrapAmount || amountIssues.includes('amount-too-high')) {
        return 'none';
    }

    return getWrapReserveStatus({
        amountInput: amount,
        nativeFormattedBalance: nativeBalance,
        reserve,
    });
};
