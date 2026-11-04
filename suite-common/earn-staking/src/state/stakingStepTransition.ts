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
    getStakingStepTransactions,
} from './stakingSessionStep';

export type StakingStepEvent =
    | { type: 'composing'; attemptId: string }
    | { type: 'composed'; attemptId: string; composed: ComposedStakingStep }
    | { type: 'compose-failed'; attemptId: string; error: StakingStepError }
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
    | { type: 'replacement-broadcast'; txid: string; isCancellation: boolean }
    | { type: 'confirmed'; txid: string }
    | { type: 'failed'; txid: string; error: StakingStepError };

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
    composeAttemptId: null,
    composed: step.composed,
});

// A compose result is taken from the attempt the step recorded; before any attempt was recorded
// there is nothing it could be stale against.
const isComposeAttempt = (
    step: Extract<StakingSessionStep, { status: 'pending' | 'composed' }>,
    attemptId: string,
) => step.composeAttemptId === null || step.composeAttemptId === attemptId;

// The one place that says which event a step accepts in which status, and what it becomes.
// Returns null when the step refuses the event, including an event of a signing attempt that
// is no longer the step's own.
export const transitionStakingStep = (
    step: StakingSessionStep,
    event: StakingStepEvent,
): StakingSessionStep | null => {
    switch (event.type) {
        case 'composing': {
            if (step.status !== 'pending' && step.status !== 'composed') return null;

            return {
                ...step,
                composeAttemptId: event.attemptId,
            };
        }
        case 'composed': {
            if (step.status !== 'pending' && step.status !== 'composed') return null;

            if (!isComposeAttempt(step, event.attemptId)) return null;

            return {
                ...getStakingStepBase(step),
                error: null,
                status: 'composed',
                composeAttemptId: event.attemptId,
                composed: event.composed,
            };
        }
        case 'compose-failed': {
            if (step.status !== 'pending' && step.status !== 'composed') return null;

            if (!isComposeAttempt(step, event.attemptId)) return null;

            return {
                ...getStakingStepBase(step),
                error: event.error,
                status: 'pending',
                composeAttemptId: event.attemptId,
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

            if (step.awaitConfirmation) {
                return {
                    ...getStakingStepBase(step),
                    error: null,
                    status: 'awaiting',
                    txid: event.txid,
                    replacements: [],
                };
            }

            return {
                ...getStakingStepBase(step),
                error: null,
                status: 'done',
                txid: event.txid,
            };
        }
        case 'broadcast-failed': {
            if (step.status !== 'broadcasting' || step.attemptId !== event.attemptId) return null;

            return toComposed(step, { kind: 'broadcast-failed', code: event.code });
        }
        case 'replacement-broadcast': {
            if (step.status !== 'awaiting') return null;

            const known = getStakingStepTransactions(step);

            if (known.some(transaction => transaction.txid === event.txid)) {
                return null;
            }

            return {
                ...step,
                replacements: [
                    ...step.replacements,
                    { txid: event.txid, isCancellation: event.isCancellation },
                ],
            };
        }
        case 'confirmed': {
            if (step.status !== 'awaiting') return null;

            const mined = getStakingStepTransactions(step).find(
                transaction => transaction.txid === event.txid,
            );

            if (mined === undefined || mined.isCancellation) return null;

            return {
                ...getStakingStepBase(step),
                status: 'done',
                txid: event.txid,
            };
        }
        case 'failed': {
            if (step.status !== 'awaiting') return null;

            if (!getStakingStepTransactions(step).some(({ txid }) => txid === event.txid)) {
                return null;
            }

            return {
                ...getStakingStepBase(step),
                error: event.error,
                status: 'failed',
                txid: event.txid,
            };
        }
    }
};
