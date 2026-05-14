import { useAllowanceTxTracking } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { type AllowanceContextValue } from './useAllowanceContext';
import { useAllowanceState } from './useAllowanceState';

interface UseAllowanceParams {
    account: Account;
}

export const useAllowance = ({ account }: UseAllowanceParams): AllowanceContextValue => {
    const tx = useAllowanceTxTracking({ accountKey: account.key });
    const state = useAllowanceState();

    return {
        tx,
        state,
    };
};
