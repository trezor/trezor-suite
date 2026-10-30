import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type {
    StakingPlatform,
    StakingProductDescriptor,
    StakingProductId,
    StakingProductInfo,
} from '@suite-common/earn-staking-common';

export type StakingProductInfoStatus = 'idle' | 'loading' | 'ready' | 'error';

export type StakingProductEntry = {
    descriptor: StakingProductDescriptor;
    info: StakingProductInfo | null;
    infoStatus: StakingProductInfoStatus;
    infoFetchedAt: number | null;
    infoError: string | null;
};

export type StakingProductsState = Partial<Record<StakingProductId, StakingProductEntry>>;

type ProductsRegisteredPayload = {
    platform: StakingPlatform;
    descriptors: readonly StakingProductDescriptor[];
};

type ProductInfoRequestedPayload = {
    productId: StakingProductId;
};

type ProductInfoFetchedPayload = {
    productId: StakingProductId;
    info: StakingProductInfo;
    fetchedAt: number;
};

type ProductInfoFailedPayload = {
    productId: StakingProductId;
    error: string;
};

export const stakingProductsInitialState: StakingProductsState = {};

const getIdleProductEntry = (descriptor: StakingProductDescriptor): StakingProductEntry => ({
    descriptor,
    info: null,
    infoStatus: 'idle',
    infoFetchedAt: null,
    infoError: null,
});

const stakingProductsSlice = createSlice({
    name: '@suite-common/earn-staking/staking/products',
    initialState: stakingProductsInitialState,
    reducers: {
        productsRegistered(
            state: StakingProductsState,
            { payload }: PayloadAction<ProductsRegisteredPayload>,
        ) {
            const products: StakingProductsState = {};

            payload.descriptors.forEach(descriptor => {
                const previous = state[descriptor.id];

                products[descriptor.id] =
                    previous === undefined
                        ? getIdleProductEntry(descriptor)
                        : { ...previous, descriptor };
            });

            return products;
        },
        productInfoRequested(
            state: StakingProductsState,
            { payload }: PayloadAction<ProductInfoRequestedPayload>,
        ) {
            const entry = state[payload.productId];

            if (entry === undefined) return;

            entry.infoStatus = 'loading';
        },
        productInfoFetched(
            state: StakingProductsState,
            { payload }: PayloadAction<ProductInfoFetchedPayload>,
        ) {
            const entry = state[payload.productId];

            if (entry === undefined) return;

            entry.info = payload.info;
            entry.infoStatus = 'ready';
            entry.infoFetchedAt = payload.fetchedAt;
            entry.infoError = null;
        },
        productInfoFailed(
            state: StakingProductsState,
            { payload }: PayloadAction<ProductInfoFailedPayload>,
        ) {
            const entry = state[payload.productId];

            if (entry === undefined) return;

            entry.infoStatus = 'error';
            entry.infoError = payload.error;
        },
    },
});

export const stakingProductsActions = stakingProductsSlice.actions;

export const stakingProductsReducer = stakingProductsSlice.reducer;
