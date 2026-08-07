import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { FormState, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type StablecoinYieldState,
    getStablecoinYieldSessionKey,
    initialStablecoinYieldState,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from './stablecoinYieldReducer';
import type { YieldFlowType, YieldPendingTransactionState } from './stablecoinYieldTypes';

const ethSymbol = asNetworkSymbol('eth');

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const getSession = (state: StablecoinYieldState, flowType: YieldFlowType) =>
    state[flowType][getStablecoinYieldSessionKey(FLOW_KEY)];

const initSession = (flowType: YieldFlowType, isWrappedNativeVault?: boolean) =>
    stablecoinYieldReducer(
        initialStablecoinYieldState,
        stablecoinYieldActions.initSession({
            flowType,
            flowKey: FLOW_KEY,
            isWrappedNativeVault,
        }),
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

        it('preserves the wrapped-native flow when resetting a session', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resetSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
            expect(getSession(state, 'deposit')?.isWrappedNativeVault).toBe(true);
        });

        it('moves a native deposit from the wrap step to approve when it is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('seeds the deposit amount with the wrapped amount', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                    amount: '0.2',
                }),
            );

            expect(getSession(state, 'deposit')?.action.amount).toBe('0.2');
        });

        it('keeps the deposit amount empty when the wrap step is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );

            expect(getSession(state, 'deposit')?.action.amount).toBeNull();
        });

        it('stores the wrap step review on the session', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.storeWrappedNativeReviewData({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                    amount: '0.2',
                    unsignedTransaction: '{"to":"0xweth"}',
                }),
            );

            expect(getSession(state, 'deposit')?.action.review).toEqual({
                type: 'wrap',
                amount: '0.2',
                unsignedTransaction: '{"to":"0xweth"}',
            });
        });

        it('marks the approve step as skipped when it is left without approving', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.skipApprovalStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            expect(getSession(state, 'deposit')?.approval.isSkipped).toBe(true);
        });

        it('clears the skipped approve step once an approval completes', () => {
            const skipped = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.skipApprovalStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );
            const returned = stablecoinYieldReducer(
                skipped,
                stablecoinYieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );
            const approved = stablecoinYieldReducer(
                returned,
                stablecoinYieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(approved, 'deposit')?.approval.isSkipped).toBe(false);
        });

        it('does not regress once the wrap step has been left', () => {
            const resolveWrap = stablecoinYieldActions.resolveWrappedNativeStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                step: 'wrap',
            });
            const once = stablecoinYieldReducer(initSession('deposit', true), resolveWrap);
            const twice = stablecoinYieldReducer(once, resolveWrap);

            expect(getSession(twice, 'deposit')?.step).toBe('approve');
        });

        it('returns a wrapped-native deposit from approve back to the wrap step', () => {
            const atApprove = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );
            const state = stablecoinYieldReducer(
                atApprove,
                stablecoinYieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('does not return to the wrap step for a non-wrapped vault', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('does not return to the wrap step while a transaction is in flight', () => {
            const atApprove = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );
            const withPendingTx = stablecoinYieldReducer(
                atApprove,
                stablecoinYieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'approve', txid: '0xabc', amount: '1' },
                }),
            );
            const state = stablecoinYieldReducer(
                withPendingTx,
                stablecoinYieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it.each(['withdraw', 'redeem'] as const)(
            'moves a wrapped-native %s from action to unwrap',
            flowType => {
                const state = stablecoinYieldReducer(
                    initSession(flowType, true),
                    stablecoinYieldActions.completeAction({
                        flowType,
                        flowKey: FLOW_KEY,
                        amount: '10',
                    }),
                );

                expect(getSession(state, flowType)?.step).toBe('unwrap');
            },
        );

        it('stores the unwrapped amount and completes the flow', () => {
            const actionCompleteState = stablecoinYieldReducer(
                initSession('withdraw', true),
                stablecoinYieldActions.completeAction({
                    flowType: 'withdraw',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );
            const state = stablecoinYieldReducer(
                actionCompleteState,
                stablecoinYieldActions.resolveWrappedNativeStep({
                    flowType: 'withdraw',
                    flowKey: FLOW_KEY,
                    step: 'unwrap',
                    amount: '10',
                }),
            );

            expect(getSession(state, 'withdraw')?.step).toBe('complete');
            expect(getSession(state, 'withdraw')?.result.unwrappedAmount).toBe('10');
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

        it('carries the entered amount into the action step when the approval step is skipped', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '25',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('25');
        });

        it('clears modify mode when the approval step is skipped so the action step re-guards allowance', () => {
            const modifying = stablecoinYieldReducer(
                initSession('deposit'),
                stablecoinYieldActions.enterModifyMode({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );
            expect(getSession(modifying, 'deposit')?.approval.isModifyMode).toBe(true);

            const state = stablecoinYieldReducer(
                modifying,
                stablecoinYieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '25',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.approval.isModifyMode).toBe(false);
        });

        it('does not skip the wrap step when an allowance check resolves early', () => {
            const state = stablecoinYieldReducer(
                initSession('deposit', true),
                stablecoinYieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
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
            symbol: ethSymbol,
            descriptor: '0xfffffffffffffffffffffffffffffffffffffffe',
            deviceStaticSessionId: '1stTestnetAddress@device_id:0',
        });
        const precomposedForm = { selectedFee: 'custom' } as unknown as FormState;
        const precomposedTx = { type: 'final', fee: '1' } as unknown as PrecomposedTransactionFinal;
        const serializedTx = { tx: '0xsignedtx', symbol: ethSymbol } as const;

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

    describe('allowance lifecycle', () => {
        const sessionPayload = { flowType: 'deposit', flowKey: FLOW_KEY } as const;

        const loadAllowance = (state: StablecoinYieldState, amount: string) =>
            stablecoinYieldReducer(
                state,
                stablecoinYieldActions.setInitializedAllowance({ ...sessionPayload, amount }),
            );

        it('stores the read allowance', () => {
            const state = loadAllowance(initSession('deposit'), '100');

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('100');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('loaded');
        });

        it('clears the amount when the read fails', () => {
            const state = stablecoinYieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                stablecoinYieldActions.setAllowanceError(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBeNull();
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('error');
        });

        it('keeps the last amount when the allowance is only invalidated', () => {
            const state = stablecoinYieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                stablecoinYieldActions.invalidateAllowance(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('100');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('idle');
        });

        it('reports a zero allowance as loaded after a revoke', () => {
            const state = stablecoinYieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                stablecoinYieldActions.revokeSuccess(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('0');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('loaded');
        });

        // A confirmed approval dispatches these two back to back — the state the read must catch.
        it('leaves a wrapped-native deposit on the action step with an idle allowance', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    loadAllowance(initSession('deposit', true), '100'),
                    stablecoinYieldActions.resolveWrappedNativeStep({
                        ...sessionPayload,
                        step: 'wrap',
                    }),
                ),
                stablecoinYieldActions.completeApproval({ ...sessionPayload, amount: '0.2' }),
            );
            const invalidated = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.invalidateAllowance(sessionPayload),
            );

            expect(getSession(invalidated, 'deposit')?.step).toBe('action');
            expect(getSession(invalidated, 'deposit')?.approval.allowanceStatus).toBe('idle');
        });

        it('refuses to return to the wrap step while the allowance is being read', () => {
            const state = stablecoinYieldReducer(
                stablecoinYieldReducer(
                    initSession('deposit', true),
                    stablecoinYieldActions.resolveWrappedNativeStep({
                        ...sessionPayload,
                        step: 'wrap',
                    }),
                ),
                stablecoinYieldActions.startInitializingAllowance(sessionPayload),
            );
            const returned = stablecoinYieldReducer(
                state,
                stablecoinYieldActions.returnToWrapStep(sessionPayload),
            );

            expect(getSession(returned, 'deposit')?.step).toBe('approve');
        });
    });
});
