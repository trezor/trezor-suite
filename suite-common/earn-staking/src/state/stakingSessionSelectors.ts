import type { AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

import type { StakingRootState } from './stakingReducer';
import type { StakingSessionKey } from './stakingSessionKey';
import {
    STAKING_ACTIVE_STEP_STATUSES,
    type StakingReviewStep,
    type StakingSession,
    type StakingSessionStep,
    hasStakingStepWithStatus,
    isStakingReviewStep,
} from './stakingSessionsReducer';

export type StakingReview = {
    session: StakingSession;
    step: StakingReviewStep;
};

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

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
                .filter(isDefined)
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

export const selectStakingReview = createWeakMapSelector(
    [selectStakingSessions],
    (sessions): StakingReview | null =>
        Object.values(sessions)
            .filter(isDefined)
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
