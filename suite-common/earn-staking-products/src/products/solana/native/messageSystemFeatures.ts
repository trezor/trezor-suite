import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';

export const EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'sol.staking.stake',
        unstake: 'sol.staking.unstake',
        withdraw: 'sol.staking.claim',
    };
