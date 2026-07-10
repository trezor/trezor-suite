import { type AccountKey } from '@suite-common/wallet-types';

import { transactionsActions } from '../../transactions/transactionsActions';
import {
    type StablecoinYieldState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldState,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from '../stablecoinYieldReducer';
import type { YieldFlowType } from '../stablecoinYieldTypes';

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const getSession = (state: StablecoinYieldState, flowType: YieldFlowType) =>
    state[flowType][getStablecoinYieldSessionKey(FLOW_KEY)];

const initSession = (flowType: YieldFlowType) =>
    stablecoinYieldReducer(
        initialStablecoinYieldState,
        stablecoinYieldActions.initSession({ flowType, flowKey: FLOW_KEY }),
    );

describe('stablecoinYieldReducer', () => {
    describe('step machine', () => {
        it('starts deposit at the approve step', () => {
            const state = initSession('deposit');

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it.each(['withdraw', 'redeem', 'claim'] as const)(
            'starts %s at the action step',
            flowType => {
                const state = initSession(flowType);

                expect(getSession(state, flowType)?.step).toBe('action');
            },
        );

        it('moves deposit to the action step when approval completes', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('10');
        });

        it('moves deposit to the action step when the approval step is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('keeps deposit on the action step when the approval skip repeats', () => {
            // The allowance refetch after a confirmed approve tx dispatches skipApprovalStep
            // again; it must not advance the flow past the action step.
            const skipAction = stablecoinYieldActions.skipApprovalStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
            });
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(initSession('deposit'), skipAction),
                skipAction,
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('completes deposit from the action step', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit'),
                    stablecoinYieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                stablecoinYieldActions.completeAction({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('complete');
            expect(getSession(state, 'deposit')?.result.completedAmount).toBe('10');
        });

        it('completes claim from the action step', () => {
            const state = stablecoinYieldReducer(
                initSession('claim'),
                stablecoinYieldActions.completeAction({
                    flowType: 'claim',
                    flowKey: FLOW_KEY,
                    amount: '0',
                }),
            );

            expect(getSession(state, 'claim')?.step).toBe('complete');
        });

        it('returns deposit to the approve step when entering modify mode', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit'),
                    stablecoinYieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                stablecoinYieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });
    });

    describe('wrap step', () => {
        it('initializes the deposit session with the wrap sub-state', () => {
            const state = initSession('deposit');

            expect(getSession(state, 'deposit')?.wrap).toEqual({
                isSubmitting: false,
                isPending: false,
                wrappedAmount: null,
            });
        });

        it('enters the wrap step', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.enterWrapStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('starts and finishes submitting the wrap with the total amount', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.startSubmittingWrap({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '2',
                }),
            );

            expect(getSession(state, 'deposit')?.wrap.isSubmitting).toBe(true);
            expect(getSession(state, 'deposit')?.action.amount).toBe('2');
            expect(getSession(state, 'deposit')?.error).toBe(null);

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.finishSubmittingWrap({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.wrap.isSubmitting).toBe(false);
        });

        it('skips the wrap step and stores the action amount', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.enterWrapStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.skipWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '1.5',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
            expect(getSession(state, 'deposit')?.action.amount).toBe('1.5');
            expect(getSession(state, 'deposit')?.wrap.wrappedAmount).toBe(null);
        });

        it('keeps a previously recorded wrap when the step is later skipped', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.completeWrap({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    wrappedAmount: '1',
                }),
            );

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.skipWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '0.5',
                }),
            );

            expect(getSession(state, 'deposit')?.wrap.wrappedAmount).toBe('1');
        });

        it('completes the wrap and moves to the approve step', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.enterWrapStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'wrap', txid: '0xabc', amount: '0.5' },
                }),
            );

            expect(getSession(state, 'deposit')?.wrap.isPending).toBe(true);

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.completeWrap({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    wrappedAmount: '0.5',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
            expect(getSession(state, 'deposit')?.wrap.isPending).toBe(false);
            expect(getSession(state, 'deposit')?.wrap.wrappedAmount).toBe('0.5');
            expect(getSession(state, 'deposit')?.action.pendingTransaction).toBe(null);
        });

        it('does not skip the approval step while the wrap step is active', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.enterWrapStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.skipApprovalStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('clears the pending wrap flag when the transaction fails', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'wrap', txid: '0xabc', amount: '0.5' },
                }),
            );

            state = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.transactionFailed({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.wrap.isPending).toBe(false);
            expect(getSession(state, 'deposit')?.action.pendingTransaction).toBe(null);
        });

        it('rewrites a replaced wrap pending txid', () => {
            let state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'wrap', txid: '0xabc', amount: '0.5' },
                }),
            );

            state = stablecoinYieldReducer(
                state,
                transactionsActions.replaceTransaction({
                    key: 'account-key' as AccountKey,
                    txid: '0xabc',
                    tx: { txid: '0xdef' } as Parameters<
                        typeof transactionsActions.replaceTransaction
                    >[0]['tx'],
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction?.txid).toBe('0xdef');
        });
    });
});
