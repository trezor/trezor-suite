import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type StakingRootState,
    type StakingState,
    stakingActions,
    stakingReducer,
} from './stakingReducer';
import { getStakingSessionKey } from './stakingSessionKey';
import {
    getStakingCurrentStep,
    selectIsStakingSessionActive,
    selectStakingCurrentStep,
    selectStakingReview,
    selectStakingSession,
    selectStakingSessionsByAccount,
} from './stakingSessionSelectors';
import { mockStakingSession, mockStakingState } from '../../mocks';

const accountKey = mockAccountKey({ symbol: asNetworkSymbol('eth') });
const otherAccountKey = mockAccountKey({ descriptor: 'other', symbol: asNetworkSymbol('eth') });
const stakePlan = mockStakingPlan({
    operation: 'stake',
    steps: [
        mockStakingStep({ id: 'freeze', kind: 'freeze', awaitConfirmation: true }),
        mockStakingStep({ id: 'vote', kind: 'vote' }),
    ],
});
const stakeSession = mockStakingSession({ plan: stakePlan, accountKey });
const claimSession = mockStakingSession({
    id: 'session-2',
    plan: mockStakingPlan({
        operation: 'claim',
        amount: null,
        steps: [mockStakingStep({ id: 'claim', kind: 'claim' })],
    }),
    accountKey,
});
const otherSession = mockStakingSession({ id: 'session-3', accountKey: otherAccountKey });
const freeze = { sessionKey: stakeSession.key, stepId: 'freeze' };
const claim = { sessionKey: claimSession.key, stepId: 'claim' };

const toRootState = (staking: StakingState): StakingRootState => ({ earn: { staking } });

const idle = toRootState(
    mockStakingState({ sessions: [stakeSession, claimSession, otherSession] }),
);
const signingFreeze = toRootState(
    [
        stakingActions.stepComposed({ ...freeze, composed: mockComposedStakingStep() }),
        stakingActions.stepSigning({ ...freeze, feeLevel: 'normal', signingStartedAt: 1_000 }),
    ].reduce(stakingReducer, idle.earn.staking),
);
const signedClaimLater = toRootState(
    [
        stakingActions.stepComposed({ ...claim, composed: mockComposedStakingStep() }),
        stakingActions.stepSigning({ ...claim, feeLevel: 'normal', signingStartedAt: 2_000 }),
        stakingActions.stepSigned({ ...claim, signed: mockSignedStakingStep() }),
    ].reduce(stakingReducer, signingFreeze.earn.staking),
);
const awaitingFreeze = toRootState(
    [
        stakingActions.stepSigned({ ...freeze, signed: mockSignedStakingStep() }),
        stakingActions.stepBroadcasting(freeze),
        stakingActions.stepBroadcast({ ...freeze, txid: 'tx1' }),
    ].reduce(stakingReducer, signingFreeze.earn.staking),
);

describe('staking session selectors', () => {
    it('selects a session by key', () => {
        expect(selectStakingSession(idle, stakeSession.key)).toBe(stakeSession);
        expect(
            selectStakingSession(
                idle,
                getStakingSessionKey({
                    accountKey,
                    productId: stakePlan.productId,
                    operation: 'unstake',
                }),
            ),
        ).toBeNull();
    });

    it('selects the sessions of an account with a stable empty result', () => {
        const unknownAccountKey = mockAccountKey({
            descriptor: 'unknown',
            symbol: asNetworkSymbol('eth'),
        });

        expect(selectStakingSessionsByAccount(idle, accountKey)).toEqual([
            stakeSession,
            claimSession,
        ]);
        expect(selectStakingSessionsByAccount(idle, otherAccountKey)).toEqual([otherSession]);
        expect(selectStakingSessionsByAccount(idle, unknownAccountKey)).toBe(
            selectStakingSessionsByAccount(idle, unknownAccountKey),
        );
        expect(selectStakingSessionsByAccount(idle, unknownAccountKey)).toEqual([]);
    });

    it('selects the first step that is not done', () => {
        const doneFreeze = toRootState(
            stakingReducer(awaitingFreeze.earn.staking, stakingActions.stepConfirmed(freeze)),
        );
        const complete = toRootState(
            [
                stakingActions.stepComposed({
                    ...freeze,
                    stepId: 'vote',
                    composed: mockComposedStakingStep(),
                }),
                stakingActions.stepSigning({
                    ...freeze,
                    stepId: 'vote',
                    feeLevel: 'normal',
                    signingStartedAt: 3_000,
                }),
                stakingActions.stepSigned({
                    ...freeze,
                    stepId: 'vote',
                    signed: mockSignedStakingStep(),
                }),
                stakingActions.stepBroadcasting({ ...freeze, stepId: 'vote' }),
                stakingActions.stepBroadcast({ ...freeze, stepId: 'vote', txid: 'tx2' }),
            ].reduce(stakingReducer, doneFreeze.earn.staking),
        );

        expect(selectStakingCurrentStep(idle, stakeSession.key)?.id).toBe('freeze');
        expect(selectStakingCurrentStep(doneFreeze, stakeSession.key)?.id).toBe('vote');
        expect(selectStakingCurrentStep(complete, stakeSession.key)).toBeNull();
        expect(selectStakingCurrentStep(idle, otherSession.key)?.status).toBe('pending');
        expect(getStakingCurrentStep(stakeSession)).toBe(stakeSession.steps[0]);
    });

    it('tells an active session from an idle one', () => {
        expect(selectIsStakingSessionActive(idle, stakeSession.key)).toBe(false);
        expect(selectIsStakingSessionActive(signingFreeze, stakeSession.key)).toBe(true);
        expect(selectIsStakingSessionActive(awaitingFreeze, stakeSession.key)).toBe(true);
        expect(selectIsStakingSessionActive(signedClaimLater, claimSession.key)).toBe(true);
    });

    it('reviews the step that is signing, signed or broadcasting', () => {
        expect(selectStakingReview(idle)).toBeNull();

        const review = selectStakingReview(signingFreeze);

        expect(review?.session.key).toBe(stakeSession.key);
        expect(review?.step).toMatchObject({ id: 'freeze', status: 'signing' });
        expect(selectStakingReview(signingFreeze)).toBe(review);
    });

    it('reviews the step whose signing started last', () => {
        const review = selectStakingReview(signedClaimLater);

        expect(review?.session.key).toBe(claimSession.key);
        expect(review?.step).toMatchObject({ id: 'claim', status: 'signed' });
    });

    it('stops reviewing a step once it is broadcast', () => {
        expect(selectStakingReview(awaitingFreeze)).toBeNull();
    });
});
