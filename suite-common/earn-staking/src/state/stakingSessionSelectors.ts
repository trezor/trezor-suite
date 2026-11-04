import type { StakingStep } from '@suite-common/earn-staking-common';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { Account, AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { isNotUndefined } from '@trezor/utils';

import type { StakingRootState } from './stakingReducer';
import type { StakingSessionKey } from './stakingSessionKey';
import {
    STAKING_ACTIVE_STEP_STATUSES,
    type StakingReviewStep,
    type StakingSessionStep,
    type StakingSessionStepStatus,
    isStakingReviewStep,
} from './stakingSessionStep';
import { type StakingSession, hasStakingStepWithStatus } from './stakingSessionsReducer';

export type StakingReview = {
    session: StakingSession;
    step: StakingReviewStep;
};

const selectStakingSessions = (state: StakingRootState) => state.earn.staking.sessions;

const selectAccountKeyParam = (_state: StakingRootState, accountKey: AccountKey) => accountKey;

export const selectStakingSession = (
    state: StakingRootState,
    sessionKey: StakingSessionKey,
): StakingSession | null => selectStakingSessions(state)[sessionKey] ?? null;

export const selectStakingSessionsByAccount = createWeakMapSelector(
    [selectStakingSessions, selectAccountKeyParam],
    (sessions, accountKey): readonly StakingSession[] =>
        returnStableArrayIfEmpty(
            Object.values(sessions)
                .filter(isNotUndefined)
                .filter(session => session.accountKey === accountKey),
        ),
);

export const getStakingCurrentStep = (session: StakingSession): StakingSessionStep | null =>
    session.steps.find(step => step.status !== 'done') ?? null;

export const selectStakingCurrentStep = (
    state: StakingRootState,
    sessionKey: StakingSessionKey,
): StakingSessionStep | null => {
    const session = selectStakingSession(state, sessionKey);

    return session === null ? null : getStakingCurrentStep(session);
};

export const selectIsStakingSessionActive = (
    state: StakingRootState,
    sessionKey: StakingSessionKey,
): boolean => {
    const session = selectStakingSession(state, sessionKey);

    return session !== null && hasStakingStepWithStatus(session, STAKING_ACTIVE_STEP_STATUSES);
};

export type AwaitingStakingStep = {
    sessionKey: StakingSessionKey;
    stepId: string;
    txid: string;
};

export const getAwaitingStakingSteps = (
    sessions: readonly StakingSession[],
): AwaitingStakingStep[] =>
    sessions.flatMap(session =>
        session.steps.flatMap(step =>
            step.status === 'awaiting'
                ? [{ sessionKey: session.key, stepId: step.id, txid: step.txid }]
                : [],
        ),
    );

export const selectAwaitingStakingSteps = createWeakMapSelector(
    [selectStakingSessionsByAccount],
    (sessions): readonly AwaitingStakingStep[] =>
        returnStableArrayIfEmpty(getAwaitingStakingSteps(sessions)),
);

export const selectAwaitingStakingStepsByTxid = (
    state: StakingRootState,
    accountKey: AccountKey,
    txid: string,
): readonly AwaitingStakingStep[] =>
    selectAwaitingStakingSteps(state, accountKey).filter(step => step.txid === txid);

export type StakingAwaitingStep = Extract<StakingSessionStep, { status: 'awaiting' }>;

export type AwaitingStakingStepContext = {
    session: StakingSession;
    step: StakingAwaitingStep;
};

export const selectAwaitingStakingStep = (
    state: StakingRootState,
    sessionKey: StakingSessionKey,
    stepId: string,
): AwaitingStakingStepContext | null => {
    const session = selectStakingSession(state, sessionKey);
    const step = session?.steps.find(candidate => candidate.id === stepId);

    return session !== null && step?.status === 'awaiting' ? { session, step } : null;
};

export const selectStakingStepStatus = (
    state: StakingRootState,
    session: StakingSession,
    stepId: string,
): StakingSessionStepStatus | null => {
    const current = selectStakingSession(state, session.key);

    if (current?.id !== session.id) return null;

    return current.steps.find(step => step.id === stepId)?.status ?? null;
};

export type StakingStepContext = {
    session: StakingSession;
    step: StakingSessionStep;
    planStep: StakingStep;
    account: Account;
};

export type StakingStepContextRejection =
    'session-not-found' | 'step-not-ready' | 'account-not-found';

export type StakingStepContextResult =
    | { success: true; context: StakingStepContext }
    | { success: false; rejection: StakingStepContextRejection };

export const selectStakingStepContext = (
    state: StakingRootState & AccountsRootState,
    sessionKey: StakingSessionKey,
): StakingStepContextResult => {
    const session = selectStakingSession(state, sessionKey);

    if (session === null) {
        return { success: false, rejection: 'session-not-found' };
    }

    const step = getStakingCurrentStep(session);
    const planStep = session.plan.steps.find(candidate => candidate.id === step?.id);

    if (step === null || planStep === undefined) {
        return { success: false, rejection: 'step-not-ready' };
    }

    const account = selectAccountByKey(state, session.accountKey);

    if (account === null) {
        return { success: false, rejection: 'account-not-found' };
    }

    const context = { session, step, planStep, account } satisfies StakingStepContext;

    return { success: true, context };
};

export const selectIsStakingSessionCurrent = (state: StakingRootState, session: StakingSession) =>
    selectStakingSession(state, session.key)?.id === session.id;

export const selectStakingReview = createWeakMapSelector(
    [selectStakingSessions],
    (sessions): StakingReview | null =>
        Object.values(sessions)
            .filter(isNotUndefined)
            .flatMap(session =>
                session.steps.filter(isStakingReviewStep).map(step => ({ session, step })),
            )
            .reduce<StakingReview | null>(
                (latest, review) =>
                    latest === null || review.step.signingStartedAt > latest.step.signingStartedAt
                        ? review
                        : latest,
                null,
            ),
);
