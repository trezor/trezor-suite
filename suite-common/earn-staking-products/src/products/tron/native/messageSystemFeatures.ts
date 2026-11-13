import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';

export const TRON_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'trx.staking.stake',
        unstake: 'trx.staking.unstake',
        withdraw: 'trx.staking.withdraw',
        claim: 'trx.staking.claim',
        vote: 'trx.staking.vote',
    };
