import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingErrorFeeLevel,
    mockStakingFeeLevels,
} from '@suite-common/earn-staking-common/mocks';
import { typedObjectKeys } from '@trezor/utils';

import {
    type StakingSessionStep,
    type StakingSessionStepStatus,
    type StakingStepError,
    getStakingStepBase,
} from './stakingSessionStep';
import { type StakingStepEvent, transitionStakingStep } from './stakingStepTransition';
import { mockStakingSessionStep } from '../../mocks';

const attemptId = 'attempt-1';
const composed = mockComposedStakingStep({ validityMs: 24_000 });
const signed = mockSignedStakingStep();
const signFailed: StakingStepError = { kind: 'sign-failed', code: 'Failure_DataError' };
const confirmationFailed: StakingStepError = { kind: 'confirmation-failed', code: null };

const base = getStakingStepBase(mockStakingSessionStep({ id: 'stake', awaitConfirmation: true }));
const signable = {
    attemptId,
    composed,
    feeLevel: 'normal' as const,
    signingStartedAt: 1_000,
    expiresAt: 25_000,
};

const stepsByStatus: Record<StakingSessionStepStatus, StakingSessionStep> = {
    pending: { ...base, status: 'pending', composeAttemptId: attemptId },
    composed: { ...base, status: 'composed', composeAttemptId: attemptId, composed },
    signing: { ...base, status: 'signing', ...signable },
    signed: { ...base, status: 'signed', ...signable, signed },
    broadcasting: { ...base, status: 'broadcasting', ...signable, signed },
    awaiting: { ...base, status: 'awaiting', txid: 'tx1' },
    done: { ...base, status: 'done', txid: 'tx1' },
    failed: { ...base, status: 'failed', txid: 'tx1', error: confirmationFailed },
};

const events: Record<StakingStepEvent['type'], StakingStepEvent> = {
    composing: { type: 'composing', attemptId },
    composed: { type: 'composed', attemptId, composed },
    'compose-failed': {
        type: 'compose-failed',
        attemptId,
        error: { kind: 'compose-failed', code: null },
    },
    signing: { type: 'signing', attemptId, feeLevel: 'normal', signingStartedAt: 1_000 },
    signed: { type: 'signed', attemptId, signed },
    cancelled: { type: 'cancelled', attemptId },
    'sign-failed': { type: 'sign-failed', attemptId, code: 'Failure_DataError' },
    expired: { type: 'expired', attemptId },
    broadcasting: { type: 'broadcasting', attemptId },
    broadcast: { type: 'broadcast', attemptId, txid: 'tx1' },
    'broadcast-failed': { type: 'broadcast-failed', attemptId, code: null },
    'txid-replaced': { type: 'txid-replaced', txid: 'tx2' },
    confirmed: { type: 'confirmed' },
    failed: { type: 'failed', error: confirmationFailed },
};

const acceptedFrom: Record<StakingStepEvent['type'], readonly StakingSessionStepStatus[]> = {
    composing: ['pending', 'composed'],
    composed: ['pending', 'composed'],
    'compose-failed': ['pending', 'composed'],
    signing: ['composed'],
    signed: ['signing'],
    cancelled: ['signing', 'signed'],
    'sign-failed': ['signing'],
    expired: ['signing', 'signed'],
    broadcasting: ['signed'],
    broadcast: ['broadcasting'],
    'broadcast-failed': ['broadcasting'],
    'txid-replaced': ['awaiting'],
    confirmed: ['awaiting'],
    failed: ['awaiting'],
};

const accepting = (event: StakingStepEvent) =>
    Object.entries(stepsByStatus)
        .filter(([, step]) => transitionStakingStep(step, event) !== null)
        .map(([status]) => status);

describe('transitionStakingStep', () => {
    it.each(typedObjectKeys(events) as StakingStepEvent['type'][])(
        'accepts %s only from the statuses of the lifecycle table',
        type => {
            expect(accepting(events[type])).toEqual(acceptedFrom[type]);
        },
    );

    it("refuses every outcome of a signing attempt that is not the step's own", () => {
        const otherAttempt = (event: StakingStepEvent) =>
            'attemptId' in event ? { ...event, attemptId: 'attempt-2' } : event;

        (
            [
                'composed',
                'compose-failed',
                'signed',
                'cancelled',
                'sign-failed',
                'expired',
                'broadcasting',
                'broadcast',
                'broadcast-failed',
            ] as const
        ).forEach(type => {
            expect(accepting(otherAttempt(events[type]))).toEqual([]);
        });
    });

    it('records a compose attempt and takes a result only before any attempt or from that one', () => {
        const unrecorded = { ...stepsByStatus.pending, composeAttemptId: null };

        expect(transitionStakingStep(unrecorded, events.composing)).toEqual(stepsByStatus.pending);
        expect(transitionStakingStep(unrecorded, events.composed)).toEqual(stepsByStatus.composed);
        expect(
            transitionStakingStep(stepsByStatus.composed, {
                type: 'composing',
                attemptId: 'attempt-2',
            }),
        ).toEqual({ ...stepsByStatus.composed, composeAttemptId: 'attempt-2' });
    });

    it('composes with a clean error and recomposes in place', () => {
        const failed = { ...stepsByStatus.pending, error: signFailed };

        expect(transitionStakingStep(failed, events.composed)).toEqual({
            ...stepsByStatus.composed,
            error: null,
        });
    });

    it('keeps a compose failure on the step and drops stale levels', () => {
        expect(transitionStakingStep(stepsByStatus.composed, events['compose-failed'])).toEqual({
            ...stepsByStatus.pending,
            error: { kind: 'compose-failed', code: null },
        });
    });

    it('starts signing only at a final level, with the attempt and the deadline', () => {
        const noDeadline = {
            ...stepsByStatus.composed,
            composed: mockComposedStakingStep({ validityMs: null }),
        };
        const errorLevel = {
            ...stepsByStatus.composed,
            composed: mockComposedStakingStep({
                feeLevels: mockStakingFeeLevels({ high: mockStakingErrorFeeLevel() }),
            }),
        };

        expect(transitionStakingStep(stepsByStatus.composed, events.signing)).toEqual(
            stepsByStatus.signing,
        );
        expect(transitionStakingStep(noDeadline, events.signing)).toMatchObject({
            expiresAt: null,
        });
        expect(
            transitionStakingStep(errorLevel, { ...events.signing, feeLevel: 'high' } as never),
        ).toBeNull();
        expect(
            transitionStakingStep(errorLevel, { ...events.signing, feeLevel: 'custom' } as never),
        ).toBeNull();
    });

    it('carries the attempt, the composed data and the signature forward', () => {
        expect(transitionStakingStep(stepsByStatus.signing, events.signed)).toEqual(
            stepsByStatus.signed,
        );
        expect(transitionStakingStep(stepsByStatus.signed, events.broadcasting)).toEqual(
            stepsByStatus.broadcasting,
        );
    });

    it('returns an attempt to composed with the error of its outcome', () => {
        const composedAgain = (error: StakingStepError | null) => ({
            ...stepsByStatus.composed,
            composeAttemptId: null,
            error,
        });

        expect(transitionStakingStep(stepsByStatus.signing, events.cancelled)).toEqual(
            composedAgain(null),
        );
        expect(transitionStakingStep(stepsByStatus.signing, events['sign-failed'])).toEqual(
            composedAgain(signFailed),
        );
        expect(transitionStakingStep(stepsByStatus.signed, events.expired)).toEqual(
            composedAgain({ kind: 'expired', code: null }),
        );
        expect(
            transitionStakingStep(stepsByStatus.broadcasting, events['broadcast-failed']),
        ).toEqual(composedAgain({ kind: 'broadcast-failed', code: null }));
    });

    it('awaits confirmation only when the step asks for it', () => {
        const noWait = { ...stepsByStatus.broadcasting, awaitConfirmation: false };

        expect(transitionStakingStep(stepsByStatus.broadcasting, events.broadcast)).toEqual(
            stepsByStatus.awaiting,
        );
        expect(transitionStakingStep(noWait, events.broadcast)).toEqual({
            ...stepsByStatus.done,
            awaitConfirmation: false,
        });
    });

    it('settles an awaiting step on its txid', () => {
        expect(transitionStakingStep(stepsByStatus.awaiting, events['txid-replaced'])).toEqual({
            ...stepsByStatus.awaiting,
            txid: 'tx2',
        });
        expect(transitionStakingStep(stepsByStatus.awaiting, events.confirmed)).toEqual(
            stepsByStatus.done,
        );
        expect(transitionStakingStep(stepsByStatus.awaiting, events.failed)).toEqual(
            stepsByStatus.failed,
        );
    });
});
