import { type TrxStats, useTronStakingStats } from '@suite-common/earn-staking-api';
import { type UseQueryResult } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type TronStakeActions, useTronStakeActions } from './useTronStakeActions';
import { useTronStakeForm } from './useTronStakeForm';
import { useTronStakePendingTransactionTracking } from './useTronStakePendingTransactionTracking';

export interface TronStakeContextValues {
    account: Account;
    representatives: UseQueryResult<TrxStats>;
    form: ReturnType<typeof useTronStakeForm>;
    actions: TronStakeActions;
}

interface UseTronStakeFlowProps {
    account: Account;
}

export const useTronStakeFlow = ({ account }: UseTronStakeFlowProps): TronStakeContextValues => {
    const { stats } = useTronStakingStats();

    const form = useTronStakeForm({ account });
    const actions = useTronStakeActions({ account, form });

    useTronStakePendingTransactionTracking({ account });

    return {
        account,
        representatives: stats,
        form,
        actions,
    };
};
