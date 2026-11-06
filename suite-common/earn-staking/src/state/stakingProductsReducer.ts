import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type {
    StakingPlatform,
    StakingProductDescriptor,
    StakingProductId,
} from '@suite-common/earn-staking-common';

export type StakingProductsState = Partial<Record<StakingProductId, StakingProductDescriptor>>;

type ProductsRegisteredPayload = {
    platform: StakingPlatform;
    descriptors: readonly StakingProductDescriptor[];
};

export const stakingProductsInitialState: StakingProductsState = {};

const stakingProductsSlice = createSlice({
    name: '@suite-common/earn-staking/staking/products',
    initialState: stakingProductsInitialState,
    reducers: {
        productsRegistered(
            state: StakingProductsState,
            { payload }: PayloadAction<ProductsRegisteredPayload>,
        ) {
            payload.descriptors.forEach(descriptor => {
                state[descriptor.id] = descriptor;
            });
        },
    },
});

export const stakingProductsActions = stakingProductsSlice.actions;

export const stakingProductsReducer = stakingProductsSlice.reducer;
