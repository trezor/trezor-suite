import type { Account } from '@suite-common/wallet-types';

import { type AllowanceContextValue } from './useAllowanceContext';
import { useAllowanceState } from './useAllowanceState';
import { useAllowanceTxTracking } from './useAllowanceTxTracking';

interface UseAllowanceParams {
    account?: Account;
}

export const useAllowance = ({ account }: UseAllowanceParams): AllowanceContextValue => {
    const tx = useAllowanceTxTracking({ accountKey: account?.key });
    const state = useAllowanceState();

    return {
        tx,
        state,
    };
};
