import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingFeeLevelLabel,
    StakingPlan,
    StakingStepKind,
    StakingStepReview,
} from '@suite-common/earn-staking-common';
import { accountsActions } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';

import type { StakingSessionKey } from './stakingSessionKey';

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

export const isStakingReviewStep = (step: StakingSessionStep): step is StakingReviewStep =>
    step.status === 'signing' || step.status === 'signed' || step.status === 'broadcasting';

type StakingStepPayload = {
    sessionKey: StakingSessionKey;
    stepId: string;
};

type FoundStakingStep = {
    session: StakingSession;
    index: number;
    step: StakingSessionStep;
};

const findStakingStep = (
    state: StakingSessionsState,
    { sessionKey, stepId }: StakingStepPayload,
): FoundStakingStep | null => {
    const session = state[sessionKey];

    if (session === undefined) return null;

    const index = session.steps.findIndex(step => step.id === stepId);
    const step = session.steps[index];

    if (step === undefined) return null;

    return { session, index, step };
};

const getStepBase = (step: StakingSessionStep): StakingSessionStepBase => ({
    id: step.id,
    kind: step.kind,
    awaitConfirmation: step.awaitConfirmation,
    review: step.review,
    error: step.error,
});

const replaceStep = (
    state: StakingSessionsState,
    { session, index }: FoundStakingStep,
    step: StakingSessionStep,
) => {
    state[session.key] = { ...session, steps: session.steps.with(index, step) };
};

const stakingSessionsSlice = createSlice({
    name: '@suite-common/earn-staking/staking/sessions',
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
        stepComposed(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { composed: ComposedStakingStep }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'pending' && step.status !== 'composed') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: null,
                status: 'composed',
                composed: payload.composed,
            });
        },
        stepComposeFailed(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'pending' && step.status !== 'composed') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: payload.error,
                status: 'pending',
            });
        },
        stepSigning(
            state: StakingSessionsState,
            {
                payload,
            }: PayloadAction<
                StakingStepPayload & { feeLevel: StakingFeeLevelLabel; signingStartedAt: number }
            >,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'composed') return;

            const { validityMs } = step.composed;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: null,
                status: 'signing',
                composed: step.composed,
                feeLevel: payload.feeLevel,
                signingStartedAt: payload.signingStartedAt,
                expiresAt: validityMs === null ? null : payload.signingStartedAt + validityMs,
            });
        },
        stepSigned(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { signed: SignedStakingStep }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'signing') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                status: 'signed',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: payload.signed,
            });
        },
        stepReset(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError | null }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (!isStakingReviewStep(step)) return;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: payload.error,
                status: 'composed',
                composed: step.composed,
            });
        },
        stepBroadcasting(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'signed') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                status: 'broadcasting',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: step.signed,
            });
        },
        stepBroadcast(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { txid: string }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'broadcasting') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: null,
                status: step.awaitConfirmation ? 'awaiting' : 'done',
                txid: payload.txid,
            });
        },
        stepTxidReplaced(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { txid: string }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'awaiting') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                status: 'awaiting',
                txid: payload.txid,
            });
        },
        stepConfirmed(state: StakingSessionsState, { payload }: PayloadAction<StakingStepPayload>) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'awaiting') return;

            replaceStep(state, found, { ...getStepBase(step), status: 'done', txid: step.txid });
        },
        stepFailed(
            state: StakingSessionsState,
            { payload }: PayloadAction<StakingStepPayload & { error: StakingStepError }>,
        ) {
            const found = findStakingStep(state, payload);

            if (found === null) return;

            const { step } = found;

            if (step.status !== 'awaiting') return;

            replaceStep(state, found, {
                ...getStepBase(step),
                error: payload.error,
                status: 'failed',
                txid: step.txid,
            });
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
        builder.addCase(
            accountsActions.removeAccount,
            (state: StakingSessionsState, { payload }) => {
                const removedAccountKeys = new Set<AccountKey>(payload.map(account => account.key));

                Object.values(state).forEach(session => {
                    if (session !== undefined && removedAccountKeys.has(session.accountKey)) {
                        delete state[session.key];
                    }
                });
            },
        );
    },
});

export const stakingSessionsActions = stakingSessionsSlice.actions;

export const stakingSessionsReducer = stakingSessionsSlice.reducer;
