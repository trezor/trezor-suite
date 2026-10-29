import { type Draft, type PayloadAction, createSlice, isDraft, original } from '@reduxjs/toolkit';

import type {
    StakingPlatform,
    StakingPosition,
    StakingProductDescriptor,
    StakingProductId,
    StakingProductInfo,
} from '@suite-common/earn-staking-common';
import { accountsActions } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { deepEqual } from '@trezor/utils';

export type StakingProductInfoStatus = 'idle' | 'loading' | 'ready' | 'error';

export type StakingProductEntry = {
    descriptor: StakingProductDescriptor;
    info: StakingProductInfo | null;
    infoStatus: StakingProductInfoStatus;
    infoFetchedAt: number | null;
    infoError: string | null;
};

export type StakingAccountPositions = Partial<Record<StakingProductId, StakingPosition>>;

export type StakingState = {
    platform: StakingPlatform | null;
    products: Partial<Record<StakingProductId, StakingProductEntry>>;
    positions: Partial<Record<AccountKey, StakingAccountPositions>>;
};

export type StakingRootState = {
    staking: StakingState;
};

export const stakingInitialState: StakingState = {
    platform: null,
    products: {},
    positions: {},
};

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

type PositionsSyncedPayload = {
    accountKey: AccountKey;
    positions: readonly StakingPosition[];
};

const NO_POSITIONS: StakingAccountPositions = {};

const getIdleProductEntry = (descriptor: StakingProductDescriptor): StakingProductEntry => ({
    descriptor,
    info: null,
    infoStatus: 'idle',
    infoFetchedAt: null,
    infoError: null,
});

export const mergeAccountPositions = (
    previous: StakingAccountPositions,
    positions: readonly StakingPosition[],
): StakingAccountPositions => {
    const keepsEveryPosition = positions.every(position => {
        const previousPosition = previous[position.productId];

        return previousPosition !== undefined && deepEqual(previousPosition, position);
    });

    if (keepsEveryPosition && Object.keys(previous).length === positions.length) return previous;

    const next: StakingAccountPositions = {};

    positions.forEach(position => {
        const previousPosition = previous[position.productId];

        next[position.productId] =
            previousPosition !== undefined && deepEqual(previousPosition, position)
                ? previousPosition
                : position;
    });

    return next;
};

const getPreviousPositions = (
    draft: StakingAccountPositions | undefined,
): StakingAccountPositions => {
    if (draft === undefined) return NO_POSITIONS;
    if (!isDraft(draft)) return draft;

    return original(draft as Draft<StakingAccountPositions>) ?? NO_POSITIONS;
};

const stakingSlice = createSlice({
    name: '@suite-common/earn-staking/staking',
    initialState: stakingInitialState,
    reducers: {
        productsRegistered(
            state: StakingState,
            { payload }: PayloadAction<ProductsRegisteredPayload>,
        ) {
            const products: StakingState['products'] = {};

            payload.descriptors.forEach(descriptor => {
                const previous = state.products[descriptor.id];

                products[descriptor.id] =
                    previous === undefined
                        ? getIdleProductEntry(descriptor)
                        : { ...previous, descriptor };
            });

            state.platform = payload.platform;
            state.products = products;
        },
        productInfoRequested(
            state: StakingState,
            { payload }: PayloadAction<ProductInfoRequestedPayload>,
        ) {
            const entry = state.products[payload.productId];

            if (entry === undefined) return;

            entry.infoStatus = 'loading';
        },
        productInfoFetched(
            state: StakingState,
            { payload }: PayloadAction<ProductInfoFetchedPayload>,
        ) {
            const entry = state.products[payload.productId];

            if (entry === undefined) return;

            entry.info = payload.info;
            entry.infoStatus = 'ready';
            entry.infoFetchedAt = payload.fetchedAt;
            entry.infoError = null;
        },
        productInfoFailed(
            state: StakingState,
            { payload }: PayloadAction<ProductInfoFailedPayload>,
        ) {
            const entry = state.products[payload.productId];

            if (entry === undefined) return;

            entry.infoStatus = 'error';
            entry.infoError = payload.error;
        },
        positionsSynced(state: StakingState, { payload }: PayloadAction<PositionsSyncedPayload>) {
            if (payload.positions.length === 0) {
                delete state.positions[payload.accountKey];

                return;
            }

            const previous = getPreviousPositions(state.positions[payload.accountKey]);
            const next = mergeAccountPositions(previous, payload.positions);

            if (next === previous) return;

            state.positions[payload.accountKey] = next;
        },
    },
    extraReducers: builder => {
        builder.addCase(accountsActions.removeAccount, (state: StakingState, { payload }) => {
            payload.forEach(account => {
                delete state.positions[account.key];
            });
        });
    },
});

export const stakingActions = stakingSlice.actions;

export const stakingReducer = stakingSlice.reducer;
