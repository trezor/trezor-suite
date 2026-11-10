import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';

export const SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'sol.staking.stake',
        unstake: 'sol.staking.unstake',
        withdraw: 'sol.staking.claim',
    };
