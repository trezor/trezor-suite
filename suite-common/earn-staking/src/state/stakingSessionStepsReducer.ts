import { type PayloadAction, createSlice, isAnyOf } from '@reduxjs/toolkit';

import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingFeeLevelLabel,
    StakingStepKind,
    StakingStepReview,
} from '@suite-common/earn-staking-common';

import type { StakingSessionKey } from './stakingSessionKey';

export const STAKING_SESSIONS_ACTION_PREFIX = '@suite-common/earn-staking/staking/sessions';

export const STAKING_STEP_ERROR_KINDS = [
    'compose-failed',
    'sign-failed',
    'broadcast-failed',
    'expired',
    'confirmation-failed',
    'replaced',
] as const;

export type StakingStepErrorKind = (typeof STAKING_STEP_ERROR_KINDS)[number];

export type StakingStepError = {
    kind: StakingStepErrorKind;
    code: string | null;
};

type StakingSessionStepBase = {
    id: string;
    kind: StakingStepKind;
    awaitConfirmation: boolean;
    review: StakingStepReview;
    error: StakingStepError | null;
};

type StakingSignableStep = {
    composed: ComposedStakingStep;
    feeLevel: StakingFeeLevelLabel;
    signingStartedAt: number;
    expiresAt: number | null;
};

export type StakingSessionStep = StakingSessionStepBase &
    (
        | { status: 'pending' }
        | { status: 'composed'; composed: ComposedStakingStep }
        | ({ status: 'signing' } & StakingSignableStep)
        | ({ status: 'signed'; signed: SignedStakingStep } & StakingSignableStep)
        | ({ status: 'broadcasting'; signed: SignedStakingStep } & StakingSignableStep)
        | { status: 'awaiting'; txid: string }
        | { status: 'done'; txid: string | null }
        | { status: 'failed'; txid: string }
    );

export type StakingSessionStepStatus = StakingSessionStep['status'];

export type StakingReviewStep = Extract<
    StakingSessionStep,
    { status: 'signing' | 'signed' | 'broadcasting' }
>;

export const STAKING_ACTIVE_STEP_STATUSES: readonly StakingSessionStepStatus[] = [
    'signing',
    'signed',
    'broadcasting',
    'awaiting',
];

export const STAKING_IN_FLIGHT_STEP_STATUSES: readonly StakingSessionStepStatus[] = [
    'signing',
    'broadcasting',
];

export const isStakingReviewStep = (step: StakingSessionStep): step is StakingReviewStep =>
    step.status === 'signing' || step.status === 'signed' || step.status === 'broadcasting';

export type StakingStepPayload = {
    sessionKey: StakingSessionKey;
    stepId: string;
};

export const stakingSessionStepsInitialState: readonly StakingSessionStep[] = [];

const findStep = (steps: StakingSessionStep[], stepId: string) => {
    const index = steps.findIndex(step => step.id === stepId);
    const step = steps[index];

    return step === undefined ? null : { index, step };
};

const getStepBase = (step: StakingSessionStep): StakingSessionStepBase => ({
    id: step.id,
    kind: step.kind,
    awaitConfirmation: step.awaitConfirmation,
    review: step.review,
    error: step.error,
});

// Reduces the steps of one session; the sessions reducer calls it for the session an action names.
const stakingSessionStepsSlice = createSlice({
    name: STAKING_SESSIONS_ACTION_PREFIX,
    initialState: stakingSessionStepsInitialState,
    reducers: {
        stepComposed(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { composed: ComposedStakingStep }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'pending' && step.status !== 'composed') return;

            state[index] = {
                ...getStepBase(step),
                error: null,
                status: 'composed',
                composed: payload.composed,
            };
        },
        stepComposeFailed(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'pending' && step.status !== 'composed') return;

            state[index] = {
                ...getStepBase(step),
                error: payload.error,
                status: 'pending',
            };
        },
        stepSigning(
            state: StakingSessionStep[],
            {
                payload,
            }: PayloadAction<
                StakingStepPayload & { feeLevel: StakingFeeLevelLabel; signingStartedAt: number }
            >,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'composed') return;

            const { validityMs } = step.composed;

            state[index] = {
                ...getStepBase(step),
                error: null,
                status: 'signing',
                composed: step.composed,
                feeLevel: payload.feeLevel,
                signingStartedAt: payload.signingStartedAt,
                expiresAt: validityMs === null ? null : payload.signingStartedAt + validityMs,
            };
        },
        stepSigned(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { signed: SignedStakingStep }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'signing') return;

            state[index] = {
                ...getStepBase(step),
                status: 'signed',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: payload.signed,
            };
        },
        stepReset(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError | null }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (!isStakingReviewStep(step)) return;

            state[index] = {
                ...getStepBase(step),
                error: payload.error,
                status: 'composed',
                composed: step.composed,
            };
        },
        stepBroadcasting(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'signed') return;

            state[index] = {
                ...getStepBase(step),
                status: 'broadcasting',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: step.signed,
            };
        },
        stepBroadcast(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { txid: string }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'broadcasting') return;

            state[index] = {
                ...getStepBase(step),
                error: null,
                status: step.awaitConfirmation ? 'awaiting' : 'done',
                txid: payload.txid,
            };
        },
        stepTxidReplaced(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { txid: string }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'awaiting') return;

            state[index] = {
                ...getStepBase(step),
                status: 'awaiting',
                txid: payload.txid,
            };
        },
        stepConfirmed(state: StakingSessionStep[], { payload }: PayloadAction<StakingStepPayload>) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'awaiting') return;

            state[index] = { ...getStepBase(step), status: 'done', txid: step.txid };
        },
        stepFailed(
            state: StakingSessionStep[],
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError }>,
        ) {
            const found = findStep(state, payload.stepId);

            if (found === null) return;

            const { index, step } = found;

            if (step.status !== 'awaiting') return;

            state[index] = {
                ...getStepBase(step),
                error: payload.error,
                status: 'failed',
                txid: step.txid,
            };
        },
    },
});

export const stakingSessionStepsActions = stakingSessionStepsSlice.actions;

export const stakingSessionStepsReducer = stakingSessionStepsSlice.reducer;

export const isStakingSessionStepAction = isAnyOf(
    stakingSessionStepsActions.stepComposed,
    stakingSessionStepsActions.stepComposeFailed,
    stakingSessionStepsActions.stepSigning,
    stakingSessionStepsActions.stepSigned,
    stakingSessionStepsActions.stepReset,
    stakingSessionStepsActions.stepBroadcasting,
    stakingSessionStepsActions.stepBroadcast,
    stakingSessionStepsActions.stepTxidReplaced,
    stakingSessionStepsActions.stepConfirmed,
    stakingSessionStepsActions.stepFailed,
);
