import type { UnknownAction } from '@reduxjs/toolkit';

import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';
import { accountsActions } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { StakingStepError } from './stakingSessionStepsReducer';
import {
    type StakingSessionsState,
    stakingSessionsActions as actions,
    stakingSessionsInitialState,
    stakingSessionsReducer,
} from './stakingSessionsReducer';
import { mockStakingSession } from '../../mocks';

const plan = mockStakingPlan({
    operation: 'stake',
    steps: [
        mockStakingStep({ id: 'freeze', kind: 'freeze', awaitConfirmation: true }),
        mockStakingStep({ id: 'vote', kind: 'vote' }),
    ],
});
const session = mockStakingSession({ plan });
const { key: sessionKey } = session;
const freeze = { sessionKey, stepId: 'freeze' };
const vote = { sessionKey, stepId: 'vote' };
const composed = mockComposedStakingStep();
const signed = mockSignedStakingStep();
const signingStartedAt = 1_777_000_000_000;
const signFailed: StakingStepError = { kind: 'sign-failed', code: 'Failure_DataError' };

const reduce = (state: StakingSessionsState, ...actionList: UnknownAction[]) =>
    actionList.reduce(stakingSessionsReducer, state);

const started = reduce(stakingSessionsInitialState, actions.sessionStarted({ session }));
const composedFreeze = reduce(started, actions.stepComposed({ ...freeze, composed }));
const signingFreeze = reduce(
    composedFreeze,
    actions.stepSigning({ ...freeze, feeLevel: 'normal', signingStartedAt }),
);
const signedFreeze = reduce(signingFreeze, actions.stepSigned({ ...freeze, signed }));
const broadcastingFreeze = reduce(signedFreeze, actions.stepBroadcasting(freeze));
const awaitingFreeze = reduce(
    broadcastingFreeze,
    actions.stepBroadcast({ ...freeze, txid: 'tx1' }),
);
const doneFreeze = reduce(awaitingFreeze, actions.stepConfirmed(freeze));
const broadcastingVote = reduce(
    doneFreeze,
    actions.stepComposed({ ...vote, composed }),
    actions.stepSigning({ ...vote, feeLevel: 'normal', signingStartedAt }),
    actions.stepSigned({ ...vote, signed }),
    actions.stepBroadcasting(vote),
);

const getStep = (state: StakingSessionsState, stepId: string) =>
    state[sessionKey]?.steps.find(step => step.id === stepId);

describe('stakingSessionsReducer', () => {
    it('starts empty', () => {
        expect(stakingSessionsReducer(undefined, { type: 'init' })).toEqual({});
    });

    describe('sessionStarted', () => {
        it('stores the session with every step pending', () => {
            expect(started[sessionKey]).toBe(session);
            expect(session.steps.map(step => step.status)).toEqual(['pending', 'pending']);
        });

        it('replaces a session with the same key while no step is active', () => {
            const replacement = mockStakingSession({ plan, id: 'session-2' });

            expect(
                reduce(composedFreeze, actions.sessionStarted({ session: replacement }))[
                    sessionKey
                ],
            ).toBe(replacement);
        });

        it('replaces a complete session', () => {
            const complete = reduce(
                broadcastingVote,
                actions.stepBroadcast({ ...vote, txid: 'tx2' }),
            );
            const replacement = mockStakingSession({ plan, id: 'session-2' });

            expect(
                reduce(complete, actions.sessionStarted({ session: replacement }))[sessionKey],
            ).toBe(replacement);
        });

        it.each([
            ['signing', signingFreeze],
            ['signed', signedFreeze],
            ['broadcasting', broadcastingFreeze],
            ['awaiting', awaitingFreeze],
        ])('refuses to replace a session with a %s step', (_status, state) => {
            const replacement = mockStakingSession({ plan, id: 'session-2' });

            expect(reduce(state, actions.sessionStarted({ session: replacement }))).toBe(state);
        });
    });

    describe('stepComposed', () => {
        it('composes a pending step', () => {
            expect(getStep(composedFreeze, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'composed',
                composed,
            });
            expect(getStep(composedFreeze, 'vote')).toBe(session.steps[1]);
        });

        it('recomposes a composed step and clears its error', () => {
            const failed = reduce(
                composedFreeze,
                actions.stepReset({ ...freeze, error: signFailed }),
            );
            const recomposed = mockComposedStakingStep({ validityMs: 24_000 });
            const state = reduce(failed, actions.stepComposed({ ...freeze, composed: recomposed }));

            expect(getStep(state, 'freeze')).toMatchObject({
                status: 'composed',
                composed: recomposed,
                error: null,
            });
        });

        it('ignores a step that is past composing', () => {
            expect(reduce(signingFreeze, actions.stepComposed({ ...freeze, composed }))).toBe(
                signingFreeze,
            );
        });

        it('ignores an unknown step or session', () => {
            expect(
                reduce(started, actions.stepComposed({ sessionKey, stepId: 'claim', composed })),
            ).toBe(started);
            expect(
                reduce(
                    started,
                    actions.stepComposed({ ...freeze, sessionKey: 'other' as never, composed }),
                ),
            ).toBe(started);
        });
    });

    describe('stepComposeFailed', () => {
        const composeFailed: StakingStepError = { kind: 'compose-failed', code: null };

        it('keeps a pending step pending with the error', () => {
            const state = reduce(
                started,
                actions.stepComposeFailed({ ...freeze, error: composeFailed }),
            );

            expect(getStep(state, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'pending',
                error: composeFailed,
            });
        });

        it('drops the previous fee levels of a composed step', () => {
            const state = reduce(
                composedFreeze,
                actions.stepComposeFailed({ ...freeze, error: composeFailed }),
            );

            expect(getStep(state, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'pending',
                error: composeFailed,
            });
        });
    });

    describe('stepSigning', () => {
        it('starts signing without a deadline when the step does not expire', () => {
            expect(getStep(signingFreeze, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'signing',
                composed,
                feeLevel: 'normal',
                signingStartedAt,
                expiresAt: null,
            });
        });

        it('stamps the deadline from the validity window', () => {
            const solanaComposed = mockComposedStakingStep({ validityMs: 24_000 });
            const state = reduce(
                started,
                actions.stepComposed({ ...freeze, composed: solanaComposed }),
                actions.stepSigning({ ...freeze, feeLevel: 'high', signingStartedAt }),
            );

            expect(getStep(state, 'freeze')).toMatchObject({
                status: 'signing',
                feeLevel: 'high',
                expiresAt: signingStartedAt + 24_000,
            });
        });

        it('ignores a step that is not composed', () => {
            expect(
                reduce(
                    started,
                    actions.stepSigning({ ...freeze, feeLevel: 'normal', signingStartedAt }),
                ),
            ).toBe(started);
        });
    });

    describe('stepSigned', () => {
        it('keeps the composed data next to the signature', () => {
            expect(getStep(signedFreeze, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'signed',
                composed,
                feeLevel: 'normal',
                signingStartedAt,
                expiresAt: null,
                signed,
            });
        });

        it('ignores a step that is not signing', () => {
            expect(reduce(composedFreeze, actions.stepSigned({ ...freeze, signed }))).toBe(
                composedFreeze,
            );
        });
    });

    describe('stepReset', () => {
        it.each([
            ['signing', signingFreeze],
            ['signed', signedFreeze],
            ['broadcasting', broadcastingFreeze],
        ])('returns a %s step to composed', (_status, state) => {
            expect(
                getStep(reduce(state, actions.stepReset({ ...freeze, error: null })), 'freeze'),
            ).toEqual({
                ...session.steps[0],
                status: 'composed',
                composed,
            });
        });

        it('keeps the error on the composed step', () => {
            const expired: StakingStepError = { kind: 'expired', code: null };

            expect(
                getStep(
                    reduce(signedFreeze, actions.stepReset({ ...freeze, error: expired })),
                    'freeze',
                ),
            ).toMatchObject({ status: 'composed', error: expired });
        });

        it('ignores a step that is awaiting', () => {
            expect(reduce(awaitingFreeze, actions.stepReset({ ...freeze, error: null }))).toBe(
                awaitingFreeze,
            );
        });
    });

    describe('stepBroadcasting', () => {
        it('moves a signed step to broadcasting', () => {
            expect(getStep(broadcastingFreeze, 'freeze')).toMatchObject({
                status: 'broadcasting',
                signed,
            });
        });

        it('ignores a step that is still signing', () => {
            expect(reduce(signingFreeze, actions.stepBroadcasting(freeze))).toBe(signingFreeze);
        });
    });

    describe('stepBroadcast', () => {
        it('awaits confirmation when the step asks for it', () => {
            expect(getStep(awaitingFreeze, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'awaiting',
                txid: 'tx1',
            });
        });

        it('completes a step that does not await confirmation', () => {
            const state = reduce(broadcastingVote, actions.stepBroadcast({ ...vote, txid: 'tx2' }));

            expect(getStep(state, 'vote')).toEqual({
                ...session.steps[1],
                status: 'done',
                txid: 'tx2',
            });
        });

        it('ignores a step that is not broadcasting', () => {
            expect(reduce(signedFreeze, actions.stepBroadcast({ ...freeze, txid: 'tx1' }))).toBe(
                signedFreeze,
            );
        });
    });

    describe('stepTxidReplaced', () => {
        it('follows a bumped transaction', () => {
            const state = reduce(
                awaitingFreeze,
                actions.stepTxidReplaced({ ...freeze, txid: 'tx1b' }),
            );

            expect(getStep(state, 'freeze')).toMatchObject({ status: 'awaiting', txid: 'tx1b' });
        });

        it('ignores a confirmed step', () => {
            expect(reduce(doneFreeze, actions.stepTxidReplaced({ ...freeze, txid: 'tx1b' }))).toBe(
                doneFreeze,
            );
        });
    });

    describe('stepConfirmed', () => {
        it('completes an awaiting step and keeps its txid', () => {
            expect(getStep(doneFreeze, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'done',
                txid: 'tx1',
            });
            expect(getStep(doneFreeze, 'vote')).toBe(session.steps[1]);
        });

        it('ignores a step that is not awaiting', () => {
            expect(reduce(awaitingFreeze, actions.stepConfirmed(vote))).toBe(awaitingFreeze);
        });
    });

    describe('stepFailed', () => {
        const confirmationFailed: StakingStepError = { kind: 'confirmation-failed', code: null };

        it('fails an awaiting step and keeps its txid', () => {
            const state = reduce(
                awaitingFreeze,
                actions.stepFailed({ ...freeze, error: confirmationFailed }),
            );

            expect(getStep(state, 'freeze')).toEqual({
                ...session.steps[0],
                status: 'failed',
                txid: 'tx1',
                error: confirmationFailed,
            });
        });

        it('ignores a step that is not awaiting', () => {
            expect(
                reduce(
                    composedFreeze,
                    actions.stepFailed({ ...freeze, error: confirmationFailed }),
                ),
            ).toBe(composedFreeze);
        });
    });

    describe('sessionDiscarded', () => {
        it.each([
            ['pending', started],
            ['composed', composedFreeze],
            ['signed', signedFreeze],
            ['awaiting', awaitingFreeze],
            ['done', doneFreeze],
        ])('removes a session whose current step is %s', (_status, state) => {
            expect(reduce(state, actions.sessionDiscarded({ sessionKey }))).toEqual({});
        });

        it.each([
            ['signing', signingFreeze],
            ['broadcasting', broadcastingFreeze],
        ])('refuses to remove a session with a %s step', (_status, state) => {
            expect(reduce(state, actions.sessionDiscarded({ sessionKey }))).toBe(state);
        });

        it('ignores an unknown session', () => {
            expect(
                reduce(started, actions.sessionDiscarded({ sessionKey: 'other' as never })),
            ).toBe(started);
        });
    });

    describe('removeAccount', () => {
        it('drops the sessions of the removed accounts only', () => {
            const removedAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
            const otherSession = mockStakingSession({ plan, accountKey: removedAccount.key });
            const state = reduce(
                awaitingFreeze,
                actions.sessionStarted({ session: otherSession }),
                accountsActions.removeAccount([removedAccount]),
            );

            expect(Object.keys(state)).toEqual([sessionKey]);
        });
    });
});
