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
} from './stakingSessionStep';
import { type StakingStepEvent, transitionStakingStep } from './stakingStepTransition';
import { mockStakingSessionStep } from '../../mocks';

const composed = mockComposedStakingStep({ validityMs: 24_000 });
const signed = mockSignedStakingStep();
const signFailed: StakingStepError = { kind: 'sign-failed', code: 'Failure_DataError' };
const confirmationFailed: StakingStepError = { kind: 'confirmation-failed', code: null };

const base = mockStakingSessionStep({ id: 'stake', awaitConfirmation: true });
const signable = {
    composed,
    feeLevel: 'normal' as const,
    signingStartedAt: 1_000,
    expiresAt: 25_000,
};

const stepsByStatus: Record<StakingSessionStepStatus, StakingSessionStep> = {
    pending: { ...base, status: 'pending' },
    composed: { ...base, status: 'composed', composed },
    signing: { ...base, status: 'signing', ...signable },
    signed: { ...base, status: 'signed', ...signable, signed },
    broadcasting: { ...base, status: 'broadcasting', ...signable, signed },
    awaiting: { ...base, status: 'awaiting', txid: 'tx1' },
    done: { ...base, status: 'done', txid: 'tx1' },
    failed: { ...base, status: 'failed', txid: 'tx1', error: confirmationFailed },
};

const events: Record<StakingStepEvent['type'], StakingStepEvent> = {
    composed: { type: 'composed', composed },
    'compose-failed': { type: 'compose-failed', error: { kind: 'compose-failed', code: null } },
    signing: { type: 'signing', feeLevel: 'normal', signingStartedAt: 1_000 },
    signed: { type: 'signed', signed },
    reset: { type: 'reset', error: null },
    broadcasting: { type: 'broadcasting' },
    broadcast: { type: 'broadcast', txid: 'tx1' },
    'txid-replaced': { type: 'txid-replaced', txid: 'tx2' },
    confirmed: { type: 'confirmed' },
    failed: { type: 'failed', error: confirmationFailed },
};

const acceptedFrom: Record<StakingStepEvent['type'], readonly StakingSessionStepStatus[]> = {
    composed: ['pending', 'composed'],
    'compose-failed': ['pending', 'composed'],
    signing: ['composed'],
    signed: ['signing'],
    reset: ['signing', 'signed', 'broadcasting'],
    broadcasting: ['signed'],
    broadcast: ['broadcasting'],
    'txid-replaced': ['awaiting'],
    confirmed: ['awaiting'],
    failed: ['awaiting'],
};

describe('transitionStakingStep', () => {
    it.each(typedObjectKeys(events) as StakingStepEvent['type'][])(
        'accepts %s only from the statuses of the lifecycle table',
        type => {
            const accepting = Object.entries(stepsByStatus)
                .filter(([, step]) => transitionStakingStep(step, events[type]) !== null)
                .map(([status]) => status);

            expect(accepting).toEqual(acceptedFrom[type]);
        },
    );

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

    it('starts signing only at a final level and stamps the deadline', () => {
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

        expect(transitionStakingStep(stepsByStatus.composed, events.signing)).toMatchObject({
            status: 'signing',
            feeLevel: 'normal',
            signingStartedAt: 1_000,
            expiresAt: 25_000,
        });
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

    it('carries the composed data and the signature forward', () => {
        expect(transitionStakingStep(stepsByStatus.signing, events.signed)).toEqual(
            stepsByStatus.signed,
        );
        expect(transitionStakingStep(stepsByStatus.signed, events.broadcasting)).toEqual(
            stepsByStatus.broadcasting,
        );
    });

    it('returns a reset step to composed with the given error', () => {
        expect(
            transitionStakingStep(stepsByStatus.broadcasting, { type: 'reset', error: signFailed }),
        ).toEqual({ ...stepsByStatus.composed, error: signFailed });
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
