import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingFeeLevelLabel,
} from '@suite-common/earn-staking-common';

import {
    type StakingReviewStep,
    type StakingSessionStep,
    type StakingStepError,
    getStakingStepBase,
} from './stakingSessionStep';

export type StakingStepEvent =
    | { type: 'composed'; composed: ComposedStakingStep }
    | { type: 'compose-failed'; error: StakingStepError }
    | {
          type: 'signing';
          attemptId: string;
          feeLevel: StakingFeeLevelLabel;
          signingStartedAt: number;
      }
    | { type: 'signed'; attemptId: string; signed: SignedStakingStep }
    | { type: 'cancelled'; attemptId: string }
    | { type: 'sign-failed'; attemptId: string; code: string | null }
    | { type: 'expired'; attemptId: string }
    | { type: 'broadcasting'; attemptId: string }
    | { type: 'broadcast'; attemptId: string; txid: string }
    | { type: 'broadcast-failed'; attemptId: string; code: string | null }
    | { type: 'txid-replaced'; txid: string }
    | { type: 'confirmed' }
    | { type: 'failed'; error: StakingStepError };

export type StakingStepEventType = StakingStepEvent['type'];

export type StakingStepEventPayload<TType extends StakingStepEventType> = Omit<
    Extract<StakingStepEvent, { type: TType }>,
    'type'
>;

const toComposed = (
    step: StakingReviewStep,
    error: StakingStepError | null,
): StakingSessionStep => ({
    ...getStakingStepBase(step),
    error,
    status: 'composed',
    composed: step.composed,
});

// The one place that says which event a step accepts in which status, and what it becomes.
// Returns null when the step refuses the event, including an event of a signing attempt that
// is no longer the step's own.
export const transitionStakingStep = (
    step: StakingSessionStep,
    event: StakingStepEvent,
): StakingSessionStep | null => {
    switch (event.type) {
        case 'composed': {
            if (step.status !== 'pending' && step.status !== 'composed') return null;

            return {
                ...getStakingStepBase(step),
                error: null,
                status: 'composed',
                composed: event.composed,
            };
        }
        case 'compose-failed': {
            if (step.status !== 'pending' && step.status !== 'composed') return null;

            return {
                ...getStakingStepBase(step),
                error: event.error,
                status: 'pending',
            };
        }
        case 'signing': {
            if (step.status !== 'composed') return null;

            if (step.composed.feeLevels[event.feeLevel]?.type !== 'final') return null;

            const { validityMs } = step.composed;

            return {
                ...getStakingStepBase(step),
                error: null,
                status: 'signing',
                attemptId: event.attemptId,
                composed: step.composed,
                feeLevel: event.feeLevel,
                signingStartedAt: event.signingStartedAt,
                expiresAt: validityMs === null ? null : event.signingStartedAt + validityMs,
            };
        }
        case 'signed': {
            if (step.status !== 'signing' || step.attemptId !== event.attemptId) return null;

            return {
                ...getStakingStepBase(step),
                status: 'signed',
                attemptId: step.attemptId,
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: event.signed,
            };
        }
        case 'cancelled': {
            if (
                (step.status !== 'signing' && step.status !== 'signed') ||
                step.attemptId !== event.attemptId
            ) {
                return null;
            }

            return toComposed(step, null);
        }
        case 'sign-failed': {
            if (step.status !== 'signing' || step.attemptId !== event.attemptId) return null;

            return toComposed(step, { kind: 'sign-failed', code: event.code });
        }
        case 'expired': {
            if (
                (step.status !== 'signing' && step.status !== 'signed') ||
                step.attemptId !== event.attemptId
            ) {
                return null;
            }

            return toComposed(step, { kind: 'expired', code: null });
        }
        case 'broadcasting': {
            if (step.status !== 'signed' || step.attemptId !== event.attemptId) return null;

            return {
                ...getStakingStepBase(step),
                status: 'broadcasting',
                attemptId: step.attemptId,
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: step.signed,
            };
        }
        case 'broadcast': {
            if (step.status !== 'broadcasting' || step.attemptId !== event.attemptId) return null;

            return {
                ...getStakingStepBase(step),
                error: null,
                status: step.awaitConfirmation ? 'awaiting' : 'done',
                txid: event.txid,
            };
        }
        case 'broadcast-failed': {
            if (step.status !== 'broadcasting' || step.attemptId !== event.attemptId) return null;

            return toComposed(step, { kind: 'broadcast-failed', code: event.code });
        }
        case 'txid-replaced': {
            if (step.status !== 'awaiting') return null;

            return {
                ...getStakingStepBase(step),
                status: 'awaiting',
                txid: event.txid,
            };
        }
        case 'confirmed': {
            if (step.status !== 'awaiting') return null;

            return {
                ...getStakingStepBase(step),
                status: 'done',
                txid: step.txid,
            };
        }
        case 'failed': {
            if (step.status !== 'awaiting') return null;

            return {
                ...getStakingStepBase(step),
                error: event.error,
                status: 'failed',
                txid: step.txid,
            };
        }
    }
};
