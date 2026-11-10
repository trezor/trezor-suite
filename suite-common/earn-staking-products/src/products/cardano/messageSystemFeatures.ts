import type { StakingProductDescriptor } from '@suite-common/earn-staking-common';

export const CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        unstake: 'ada.staking.unstake',
        claim: 'ada.staking.claim',
        vote: 'ada.staking.vote',
    };

export const CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES: StakingProductDescriptor['messageSystemFeatures'] =
    {
        stake: 'ada.staking.stake',
        ...CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
    };
