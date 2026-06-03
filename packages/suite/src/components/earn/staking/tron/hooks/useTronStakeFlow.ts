import { type TrxStats, useTronStakingStats } from '@suite-common/earn-staking-api';
import { type UseQueryResult } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

export interface TronStakeContextValues {
    account: Account;
    representatives: UseQueryResult<TrxStats>;
}

interface UseTronStakeFlowProps {
    account: Account;
}

export const useTronStakeFlow = ({ account }: UseTronStakeFlowProps): TronStakeContextValues => {
    const representatives = useTronStakingStats();

    return {
        account,
        representatives,
    };
};
