import type { FormState, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type StablecoinYieldState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldState,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from '../stablecoinYieldReducer';
import type { YieldFlowType, YieldPendingTransactionState } from '../stablecoinYieldTypes';

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const getSession = (state: StablecoinYieldState, flowType: YieldFlowType) =>
    state[flowType][getStablecoinYieldSessionKey(FLOW_KEY)];

const initSession = (flowType: YieldFlowType, isNativeDeposit?: boolean) =>
    stablecoinYieldReducer(
        initialStablecoinYieldState,
        stablecoinYieldActions.initSession({ flowType, flowKey: FLOW_KEY, isNativeDeposit }),
    );

describe('stablecoinYieldReducer', () => {
    describe('step machine', () => {
        it('starts deposit at the approve step', () => {
            const state = initSession('deposit');

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('starts a native-token deposit at the wrap step', () => {
            const state = initSession('deposit', true);

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('moves a native deposit from the wrap step to approve when it is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.skipWrapStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('does not regress once the wrap step has been left', () => {
            // skipWrapStep must only advance from the wrap step, so a repeat can't pull the
            // flow back from approve/action.
            const skipWrap = stablecoinYieldActions.skipWrapStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
            });
            const once = stablecoinYieldReducer(initSession('deposit', true), skipWrap);
            const twice = stablecoinYieldReducer(once, skipWrap);

            expect(getSession(twice, 'deposit')?.step).toBe('approve');
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

        it('preserves the in-flight pending transaction when entering modify mode', () => {
            const pendingTransaction: YieldPendingTransactionState = {
                type: 'deposit',
                txid: '0xpendingtxid',
                amount: '100',
            };
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit'),
                    stablecoinYieldActions.setPendingTx({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        tx: pendingTransaction,
                    }),
                ),
                stablecoinYieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toEqual(
                pendingTransaction,
            );
        });
    });

    describe('txReview', () => {
        const ACCOUNT_KEY = mockAccountKey({
            symbol: 'eth',
            descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
            deviceStaticSessionId: '1stTestnetAddress@device_id:0',
        });
        const precomposedForm = { selectedFee: 'custom' } as unknown as FormState;
        const precomposedTx = { type: 'final', fee: '1' } as unknown as PrecomposedTransactionFinal;
        const serializedTx = { tx: '0xsignedtx', symbol: 'eth' } as const;

        const storePrecomposed = (state: StablecoinYieldState) =>
            stablecoinYieldReducer(
                state,
                stablecoinYieldActions.storePrecomposedTransaction({
                    precomposedTx,
                    precomposedForm,
                    accountKey: ACCOUNT_KEY,
                    flowKey: FLOW_KEY,
                    flowType: 'deposit',
                }),
            );

        it('tags the precomposed transaction with the flow identity and timestamp', () => {
            const before = new Date().getTime();
            const state = storePrecomposed(initialStablecoinYieldState);

            expect(state.txReview.accountKey).toBe(ACCOUNT_KEY);
            expect(state.txReview.flowKey).toBe(FLOW_KEY);
            expect(state.txReview.flowType).toBe('deposit');
            expect(state.txReview.createdTimestamp).toBeGreaterThanOrEqual(before);
            expect(state.txReview.serializedTx).toBeUndefined();
        });

        it('clears the flow identity when the transaction is discarded', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    storePrecomposed(initialStablecoinYieldState),
                    stablecoinYieldActions.storeSignedTransaction({ serializedTx }),
                ),
                stablecoinYieldActions.discardTransaction(),
            );

            expect(state.txReview).toEqual({
                precomposedTx: undefined,
                precomposedForm: undefined,
                availableRewards: undefined,
                serializedTx: undefined,
                accountKey: undefined,
                flowKey: undefined,
                flowType: undefined,
                createdTimestamp: undefined,
            });
        });
    });
});
