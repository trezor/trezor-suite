import { createReducer } from '@reduxjs/toolkit';

import type { StakingPlatform } from '@suite-common/earn-staking-common';

import { stakingProductsActions } from './stakingProductsReducer';

export type StakingPlatformState = StakingPlatform | null;

export const stakingPlatformInitialState: StakingPlatformState = null;

export const stakingPlatformReducer = createReducer<StakingPlatformState>(
    stakingPlatformInitialState,
    builder => {
        builder.addCase(
            stakingProductsActions.productsRegistered,
            (_state: StakingPlatformState, { payload }) => payload.platform,
        );
    },
);
