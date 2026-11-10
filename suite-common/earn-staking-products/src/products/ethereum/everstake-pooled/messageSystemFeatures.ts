import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';

export const ETHEREUM_EVERSTAKE_POOLED_PRODUCT_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'eth.staking.stake',
        unstake: 'eth.staking.unstake',
        withdraw: 'eth.staking.claim',
    };
