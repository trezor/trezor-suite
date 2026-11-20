import { type Draft, type PayloadAction, createSlice, isDraft, original } from '@reduxjs/toolkit';

import type { StakingPosition, StakingProductId } from '@suite-common/earn-staking-common';
import { accountsActions } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { deepEqual } from '@trezor/utils';

export type StakingAccountPositions = Partial<Record<StakingProductId, StakingPosition>>;

export type StakingPositionsState = Partial<Record<AccountKey, StakingAccountPositions>>;

type PositionsSyncedPayload = {
    accountKey: AccountKey;
    positions: readonly StakingPosition[];
};

export const stakingPositionsInitialState: StakingPositionsState = {};

const NO_POSITIONS: StakingAccountPositions = {};

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

const stakingPositionsSlice = createSlice({
    name: '@suite-common/earn-staking/staking/positions',
    initialState: stakingPositionsInitialState,
    reducers: {
        positionsSynced(
            state: StakingPositionsState,
            { payload }: PayloadAction<PositionsSyncedPayload>,
        ) {
            if (payload.positions.length === 0) {
                delete state[payload.accountKey];

                return;
            }

            const previous = getPreviousPositions(state[payload.accountKey]);
            const next = mergeAccountPositions(previous, payload.positions);

            if (next === previous) return;

            state[payload.accountKey] = next;
        },
    },
    extraReducers: builder => {
        builder.addCase(
            accountsActions.removeAccount,
            (state: StakingPositionsState, { payload }) => {
                payload.forEach(account => {
                    delete state[account.key];
                });
            },
        );
    },
});

export const stakingPositionsActions = stakingPositionsSlice.actions;

export const stakingPositionsReducer = stakingPositionsSlice.reducer;
