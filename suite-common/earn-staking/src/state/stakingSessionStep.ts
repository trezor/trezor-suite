import type {
    ComposedStakingStep,
    SignedStakingStep,
    StakingFeeLevelLabel,
    StakingStepKind,
    StakingStepReview,
} from '@suite-common/earn-staking-common';

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

export type StakingSessionStepBase = {
    id: string;
    kind: StakingStepKind;
    awaitConfirmation: boolean;
    review: StakingStepReview;
    error: StakingStepError | null;
};

type StakingSignableStep = {
    attemptId: string;
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

export const getStakingStepBase = (step: StakingSessionStep): StakingSessionStepBase => ({
    id: step.id,
    kind: step.kind,
    awaitConfirmation: step.awaitConfirmation,
    review: step.review,
    error: step.error,
});
