import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import type { AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

const attemptId = 'attempt-1';

import {
    type StakingRootState,
    type StakingState,
    stakingActions,
    stakingReducer,
} from './stakingReducer';
import { getStakingSessionKey } from './stakingSessionKey';
import {
    getAwaitingStakingSteps,
    getStakingCurrentStep,
    selectAwaitingStakingStep,
    selectAwaitingStakingSteps,
    selectAwaitingStakingStepsByTxid,
    selectIsStakingSessionActive,
    selectIsStakingSessionCurrent,
    selectStakingCurrentStep,
    selectStakingReview,
    selectStakingSession,
    selectStakingSessionsByAccount,
    selectStakingStepContext,
    selectStakingStepStatus,
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
        stakingActions.stepSigning({
            ...freeze,
            attemptId,
            feeLevel: 'normal',
            signingStartedAt: 1_000,
        }),
    ].reduce(stakingReducer, idle.earn.staking),
);
const signedClaimLater = toRootState(
    [
        stakingActions.stepComposed({ ...claim, composed: mockComposedStakingStep() }),
        stakingActions.stepSigning({
            ...claim,
            attemptId,
            feeLevel: 'normal',
            signingStartedAt: 2_000,
        }),
        stakingActions.stepSigned({ ...claim, attemptId, signed: mockSignedStakingStep() }),
    ].reduce(stakingReducer, signingFreeze.earn.staking),
);
const awaitingFreeze = toRootState(
    [
        stakingActions.stepSigned({ ...freeze, attemptId, signed: mockSignedStakingStep() }),
        stakingActions.stepBroadcasting({ ...freeze, attemptId }),
        stakingActions.stepBroadcast({ ...freeze, attemptId, txid: 'tx1' }),
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
                    attemptId,
                    stepId: 'vote',
                    feeLevel: 'normal',
                    signingStartedAt: 3_000,
                }),
                stakingActions.stepSigned({
                    ...freeze,
                    attemptId,
                    stepId: 'vote',
                    signed: mockSignedStakingStep(),
                }),
                stakingActions.stepBroadcasting({ ...freeze, stepId: 'vote', attemptId }),
                stakingActions.stepBroadcast({ ...freeze, stepId: 'vote', attemptId, txid: 'tx2' }),
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

    it('selects a step with its session only while it awaits confirmation', () => {
        expect(selectAwaitingStakingStep(awaitingFreeze, stakeSession.key, 'freeze')).toEqual({
            session: selectStakingSession(awaitingFreeze, stakeSession.key),
            step: {
                id: 'freeze',
                kind: 'freeze',
                awaitConfirmation: true,
                review: 'app-and-device',
                error: null,
                status: 'awaiting',
                txid: 'tx1',
            },
        });
        expect(selectAwaitingStakingStep(signingFreeze, stakeSession.key, 'freeze')).toBeNull();
        expect(selectAwaitingStakingStep(awaitingFreeze, stakeSession.key, 'vote')).toBeNull();
        expect(selectAwaitingStakingStep(awaitingFreeze, claimSession.key, 'freeze')).toBeNull();
    });

    it('lists the awaiting steps of an account with their txids', () => {
        const freezeAwaiting = { sessionKey: stakeSession.key, stepId: 'freeze', txid: 'tx1' };

        expect(getAwaitingStakingSteps([stakeSession, claimSession])).toEqual([]);
        expect(selectAwaitingStakingSteps(awaitingFreeze, accountKey)).toEqual([freezeAwaiting]);
        expect(selectAwaitingStakingSteps(awaitingFreeze, accountKey)).toBe(
            selectAwaitingStakingSteps(awaitingFreeze, accountKey),
        );
        expect(selectAwaitingStakingSteps(idle, accountKey)).toBe(
            selectAwaitingStakingSteps(idle, otherAccountKey),
        );
        expect(selectAwaitingStakingStepsByTxid(awaitingFreeze, accountKey, 'tx1')).toEqual([
            freezeAwaiting,
        ]);
        expect(selectAwaitingStakingStepsByTxid(awaitingFreeze, accountKey, 'tx9')).toEqual([]);
        expect(selectAwaitingStakingStepsByTxid(awaitingFreeze, otherAccountKey, 'tx1')).toEqual(
            [],
        );
    });

    it('reads a step status only while the session is the one the caller holds', () => {
        expect(selectStakingStepStatus(idle, stakeSession, 'freeze')).toBe('pending');
        expect(selectStakingStepStatus(signingFreeze, stakeSession, 'freeze')).toBe('signing');
        expect(
            selectStakingStepStatus(idle, { ...stakeSession, id: 'replaced' }, 'freeze'),
        ).toBeNull();
        expect(selectStakingStepStatus(idle, stakeSession, 'missing')).toBeNull();
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

describe('selectStakingStepContext', () => {
    const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
    const session = mockStakingSession({ accountKey: account.key });
    const stake = { sessionKey: session.key, stepId: 'stake' };

    const createState = (
        sessions = [session],
        accounts = [account],
    ): StakingRootState & AccountsRootState => ({
        earn: { staking: mockStakingState({ sessions }) },
        wallet: { accounts },
    });

    it('resolves the session, its current step, the plan step and the account', () => {
        expect(selectStakingStepContext(createState(), session.key)).toEqual({
            success: true,
            context: {
                session,
                step: session.steps[0],
                planStep: session.plan.steps[0],
                account,
            },
        });
    });

    it('rejects an unknown session', () => {
        const unknownKey = getStakingSessionKey({
            accountKey: account.key,
            productId: session.plan.productId,
            operation: 'unstake',
        });

        expect(selectStakingStepContext(createState(), unknownKey)).toEqual({
            success: false,
            rejection: 'session-not-found',
        });
    });

    it('rejects a complete session', () => {
        const state = createState();
        const complete = [
            stakingActions.stepComposed({ ...stake, composed: mockComposedStakingStep() }),
            stakingActions.stepSigning({
                ...stake,
                attemptId,
                feeLevel: 'normal',
                signingStartedAt: 1,
            }),
            stakingActions.stepSigned({ ...stake, attemptId, signed: mockSignedStakingStep() }),
            stakingActions.stepBroadcasting({ ...stake, attemptId }),
            stakingActions.stepBroadcast({ ...stake, attemptId, txid: 'tx1' }),
        ].reduce(stakingReducer, state.earn.staking);

        expect(
            selectStakingStepContext({ ...state, earn: { staking: complete } }, session.key),
        ).toEqual({ success: false, rejection: 'step-not-ready' });
    });

    it('rejects a session whose account is gone', () => {
        expect(selectStakingStepContext(createState([session], []), session.key)).toEqual({
            success: false,
            rejection: 'account-not-found',
        });
    });

    it('tells a replaced session from the one a thunk started with', () => {
        const state = createState();
        const replaced = stakingReducer(
            state.earn.staking,
            stakingActions.sessionStarted({ session: { ...session, id: 'session-2' } }),
        );

        expect(selectIsStakingSessionCurrent(state, session)).toBe(true);
        expect(selectIsStakingSessionCurrent({ earn: { staking: replaced } }, session)).toBe(false);
        expect(selectIsStakingSessionCurrent(createState([]), session)).toBe(false);
    });
});
