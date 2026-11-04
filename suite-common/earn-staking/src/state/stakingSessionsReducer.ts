import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { StakingPlan } from '@suite-common/earn-staking-common';
import { accountsActions } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';

import type { StakingSessionKey } from './stakingSessionKey';
import {
    STAKING_ACTIVE_STEP_STATUSES,
    STAKING_IN_FLIGHT_STEP_STATUSES,
    type StakingSessionStep,
    type StakingSessionStepStatus,
} from './stakingSessionStep';
import {
    STAKING_SESSIONS_ACTION_PREFIX,
    isStakingSessionStepAction,
    stakingSessionStepsActions,
    stakingSessionStepsReducer,
} from './stakingSessionStepsReducer';

export type StakingSession = {
    id: string;
    key: StakingSessionKey;
    accountKey: AccountKey;
    plan: StakingPlan;
    steps: readonly StakingSessionStep[];
    createdAt: number;
};

export type StakingSessionsState = Partial<Record<StakingSessionKey, StakingSession>>;

export const stakingSessionsInitialState: StakingSessionsState = {};

export const hasStakingStepWithStatus = (
    session: StakingSession,
    statuses: readonly StakingSessionStepStatus[],
) => session.steps.some(step => statuses.includes(step.status));

const stakingSessionsSlice = createSlice({
    name: STAKING_SESSIONS_ACTION_PREFIX,
    initialState: stakingSessionsInitialState,
    reducers: {
        sessionStarted(
            state: StakingSessionsState,
            { payload }: PayloadAction<{ session: StakingSession }>,
        ) {
            const current = state[payload.session.key];

            if (
                current !== undefined &&
                hasStakingStepWithStatus(current, STAKING_ACTIVE_STEP_STATUSES)
            ) {
                return;
            }

            state[payload.session.key] = payload.session;
        },
        sessionDiscarded(
            state: StakingSessionsState,
            { payload }: PayloadAction<{ sessionKey: StakingSessionKey }>,
        ) {
            const session = state[payload.sessionKey];

            if (
                session === undefined ||
                hasStakingStepWithStatus(session, STAKING_IN_FLIGHT_STEP_STATUSES)
            ) {
                return;
            }

            delete state[payload.sessionKey];
        },
    },
    extraReducers: builder => {
        builder
            .addCase(accountsActions.removeAccount, (state: StakingSessionsState, { payload }) => {
                const removedAccountKeys = new Set<AccountKey>(payload.map(account => account.key));

                Object.values(state).forEach(session => {
                    if (session !== undefined && removedAccountKeys.has(session.accountKey)) {
                        delete state[session.key];
                    }
                });
            })
            .addMatcher(isStakingSessionStepAction, (state: StakingSessionsState, action) => {
                const session = state[action.payload.sessionKey];

                if (session === undefined) return;

                const steps = stakingSessionStepsReducer(session.steps, action);

                if (steps !== session.steps) {
                    state[session.key] = { ...session, steps };
                }
            });
    },
});

export const stakingSessionsActions = {
    ...stakingSessionsSlice.actions,
    ...stakingSessionStepsActions,
};

export const stakingSessionsReducer = stakingSessionsSlice.reducer;
