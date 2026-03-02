import z from 'zod';

import {
    SolanaStakeAccountRewardItem,
    SolanaTotalStakeRewardsResponse,
} from '../schemas/everstake-sol-rewards';

export type SolanaStakeAccountReward = z.infer<typeof SolanaStakeAccountRewardItem>;

export type SolanaStakeRewardsByAccount = {
    [address: string]: SolanaStakeAccountReward[];
};

export type SolanaTotalStakeRewardsByAccount = {
    [address: string]: z.infer<typeof SolanaTotalStakeRewardsResponse>['rewards'];
};
