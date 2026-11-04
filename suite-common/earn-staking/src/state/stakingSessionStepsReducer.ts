import { type PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import type { StakingSessionKey } from './stakingSessionKey';
import type { StakingSessionStep } from './stakingSessionStep';
import {
    type StakingStepEvent,
    type StakingStepEventPayload,
    transitionStakingStep,
} from './stakingStepTransition';

export const STAKING_SESSIONS_ACTION_PREFIX = '@suite-common/earn-staking/staking/sessions';

export type StakingStepPayload = {
    sessionKey: StakingSessionKey;
    stepId: string;
};

type StakingStepActionPayload<TType extends StakingStepEvent['type']> = PayloadAction<
    StakingStepPayload & StakingStepEventPayload<TType>
>;

export const stakingSessionStepsInitialState: readonly StakingSessionStep[] = [];

// Only the current step, the first one that is not done, takes events; the plan runs in order.
const applyStakingStepEvent = (
    steps: StakingSessionStep[],
    stepId: string,
    event: StakingStepEvent,
) => {
    const index = steps.findIndex(step => step.status !== 'done');
    const step = steps[index];

    if (step?.id !== stepId) return;

    const next = transitionStakingStep(step, event);

    if (next !== null) {
        steps[index] = next;
    }
};

// Reduces the steps of one session; the sessions reducer calls it for the session an action names.
const stakingSessionStepsSlice = createSlice({
    name: STAKING_SESSIONS_ACTION_PREFIX,
    initialState: stakingSessionStepsInitialState,
    reducers: {
        stepComposing(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'composing'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'composing',
                attemptId: payload.attemptId,
            });
        },
        stepComposed(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'composed'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'composed',
                attemptId: payload.attemptId,
                composed: payload.composed,
            });
        },
        stepComposeFailed(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'compose-failed'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'compose-failed',
                attemptId: payload.attemptId,
                error: payload.error,
            });
        },
        stepSigning(state: StakingSessionStep[], { payload }: StakingStepActionPayload<'signing'>) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'signing',
                attemptId: payload.attemptId,
                feeLevel: payload.feeLevel,
                signingStartedAt: payload.signingStartedAt,
            });
        },
        stepSigned(state: StakingSessionStep[], { payload }: StakingStepActionPayload<'signed'>) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'signed',
                attemptId: payload.attemptId,
                signed: payload.signed,
            });
        },
        stepCancelled(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'cancelled'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'cancelled',
                attemptId: payload.attemptId,
            });
        },
        stepSignFailed(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'sign-failed'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'sign-failed',
                attemptId: payload.attemptId,
                code: payload.code,
            });
        },
        stepExpired(state: StakingSessionStep[], { payload }: StakingStepActionPayload<'expired'>) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'expired',
                attemptId: payload.attemptId,
            });
        },
        stepBroadcasting(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'broadcasting'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'broadcasting',
                attemptId: payload.attemptId,
            });
        },
        stepBroadcast(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'broadcast'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'broadcast',
                attemptId: payload.attemptId,
                txid: payload.txid,
            });
        },
        stepBroadcastFailed(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'broadcast-failed'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'broadcast-failed',
                attemptId: payload.attemptId,
                code: payload.code,
            });
        },
        stepReplacementBroadcast(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'replacement-broadcast'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'replacement-broadcast',
                txid: payload.txid,
                isCancellation: payload.isCancellation,
            });
        },
        stepConfirmed(
            state: StakingSessionStep[],
            { payload }: StakingStepActionPayload<'confirmed'>,
        ) {
            applyStakingStepEvent(state, payload.stepId, { type: 'confirmed', txid: payload.txid });
        },
        stepFailed(state: StakingSessionStep[], { payload }: StakingStepActionPayload<'failed'>) {
            applyStakingStepEvent(state, payload.stepId, {
                type: 'failed',
                txid: payload.txid,
                error: payload.error,
            });
        },
    },
});

export const stakingSessionStepsActions = stakingSessionStepsSlice.actions;

export const stakingSessionStepsReducer = stakingSessionStepsSlice.reducer;

export const isStakingSessionStepAction = isAnyOf(
    stakingSessionStepsActions.stepComposing,
    stakingSessionStepsActions.stepComposed,
    stakingSessionStepsActions.stepComposeFailed,
    stakingSessionStepsActions.stepSigning,
    stakingSessionStepsActions.stepSigned,
    stakingSessionStepsActions.stepCancelled,
    stakingSessionStepsActions.stepSignFailed,
    stakingSessionStepsActions.stepExpired,
    stakingSessionStepsActions.stepBroadcasting,
    stakingSessionStepsActions.stepBroadcast,
    stakingSessionStepsActions.stepBroadcastFailed,
    stakingSessionStepsActions.stepReplacementBroadcast,
    stakingSessionStepsActions.stepConfirmed,
    stakingSessionStepsActions.stepFailed,
);
