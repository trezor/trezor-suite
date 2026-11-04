import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingFeeLevelLabel,
} from '@suite-common/earn-staking-common';

import {
    type StakingSessionStep,
    type StakingStepError,
    getStakingStepBase,
    isStakingReviewStep,
} from './stakingSessionStep';

export type StakingStepEvent =
    | { type: 'composed'; composed: ComposedStakingStep }
    | { type: 'compose-failed'; error: StakingStepError }
    | { type: 'signing'; feeLevel: StakingFeeLevelLabel; signingStartedAt: number }
    | { type: 'signed'; signed: SignedStakingStep }
    | { type: 'reset'; error: StakingStepError | null }
    | { type: 'broadcasting' }
    | { type: 'broadcast'; txid: string }
    | { type: 'txid-replaced'; txid: string }
    | { type: 'confirmed' }
    | { type: 'failed'; error: StakingStepError };

export type StakingStepEventType = StakingStepEvent['type'];

export type StakingStepEventPayload<TType extends StakingStepEventType> = Omit<
    Extract<StakingStepEvent, { type: TType }>,
    'type'
>;

// The one place that says which event a step accepts in which status, and what it becomes.
// Returns null when the step refuses the event.
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
                composed: step.composed,
                feeLevel: event.feeLevel,
                signingStartedAt: event.signingStartedAt,
                expiresAt: validityMs === null ? null : event.signingStartedAt + validityMs,
            };
        }
        case 'signed': {
            if (step.status !== 'signing') return null;

            return {
                ...getStakingStepBase(step),
                status: 'signed',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: event.signed,
            };
        }
        case 'reset': {
            if (!isStakingReviewStep(step)) return null;

            return {
                ...getStakingStepBase(step),
                error: event.error,
                status: 'composed',
                composed: step.composed,
            };
        }
        case 'broadcasting': {
            if (step.status !== 'signed') return null;

            return {
                ...getStakingStepBase(step),
                status: 'broadcasting',
                composed: step.composed,
                feeLevel: step.feeLevel,
                signingStartedAt: step.signingStartedAt,
                expiresAt: step.expiresAt,
                signed: step.signed,
            };
        }
        case 'broadcast': {
            if (step.status !== 'broadcasting') return null;

            return {
                ...getStakingStepBase(step),
                error: null,
                status: step.awaitConfirmation ? 'awaiting' : 'done',
                txid: event.txid,
            };
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
