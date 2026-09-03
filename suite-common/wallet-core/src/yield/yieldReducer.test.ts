import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { FormState, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type YieldState,
    getYieldSessionKey,
    initialStablecoinYieldState,
    yieldActions,
    yieldReducer,
} from './yieldReducer';
import type { YieldFlowType, YieldPendingTransactionState } from './yieldTypes';
import { transactionsActions } from '../transactions/transactionsActions';

const ethSymbol = asNetworkSymbol('eth');

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const getSession = (state: YieldState, flowType: YieldFlowType) =>
    state[flowType][getYieldSessionKey(FLOW_KEY)];

const initSession = (flowType: YieldFlowType, isWrappedNativeVault?: boolean) =>
    yieldReducer(
        initialStablecoinYieldState,
        yieldActions.initSession({
            flowType,
            flowKey: FLOW_KEY,
            isWrappedNativeVault,
        }),
    );

/** A deposit session on the action step, its approve transaction broadcast and confirmed. */
const approveConfirmed = () =>
    yieldReducer(
        yieldReducer(
            initSession('deposit'),
            yieldActions.setPendingTx({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                tx: { type: 'approve', txid: '0xapprovetxid', amount: '100' },
            }),
        ),
        yieldActions.completeApproval({
            flowType: 'deposit',
            flowKey: FLOW_KEY,
            amount: '100',
        }),
    );

describe('yieldReducer', () => {
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
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.resetSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
            expect(getSession(state, 'deposit')?.isWrappedNativeVault).toBe(true);
        });

        it('moves a native deposit from the wrap step to approve when it is skipped', () => {
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('seeds the deposit amount with the wrapped amount', () => {
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                    amount: '0.2',
                }),
            );

            expect(getSession(state, 'deposit')?.action.amount).toBe('0.2');
        });

        it('keeps the deposit amount empty when the wrap step is skipped', () => {
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );

            expect(getSession(state, 'deposit')?.action.amount).toBeNull();
        });

        it('stores the wrap step review on the session', () => {
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.storeWrappedNativeReviewData({
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
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.skipApprovalStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );

            expect(getSession(state, 'deposit')?.approval.isSkipped).toBe(true);
        });

        it('clears the skipped approve step once an approval completes', () => {
            const skipped = yieldReducer(
                initSession('deposit'),
                yieldActions.skipApprovalStep({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );
            const returned = yieldReducer(
                skipped,
                yieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );
            const approved = yieldReducer(
                returned,
                yieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(approved, 'deposit')?.approval.isSkipped).toBe(false);
        });

        it('does not regress once the wrap step has been left', () => {
            const resolveWrap = yieldActions.resolveWrappedNativeStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                step: 'wrap',
            });
            const once = yieldReducer(initSession('deposit', true), resolveWrap);
            const twice = yieldReducer(once, resolveWrap);

            expect(getSession(twice, 'deposit')?.step).toBe('approve');
        });

        it('returns a wrapped-native deposit from approve back to the wrap step', () => {
            const atApprove = yieldReducer(
                initSession('deposit', true),
                yieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );
            const state = yieldReducer(
                atApprove,
                yieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('keeps the modify origin across a wrap-step detour', () => {
            const sessionPayload = { flowType: 'deposit', flowKey: FLOW_KEY } as const;
            const atAction = yieldReducer(
                yieldReducer(
                    initSession('deposit', true),
                    yieldActions.resolveWrappedNativeStep({ ...sessionPayload, step: 'wrap' }),
                ),
                yieldActions.skipApprovalStep(sessionPayload),
            );
            const atWrap = yieldReducer(
                yieldReducer(atAction, yieldActions.enterModifyMode(sessionPayload)),
                yieldActions.returnToWrapStep(sessionPayload),
            );
            const state = yieldReducer(
                atWrap,
                yieldActions.resolveWrappedNativeStep({ ...sessionPayload, step: 'wrap' }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
            expect(getSession(state, 'deposit')?.approval.origin).toBe('modify');
        });

        it('ends the modify origin when the approval completes', () => {
            const modifying = yieldReducer(
                initSession('deposit'),
                yieldActions.enterModifyMode({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );
            const state = yieldReducer(
                modifying,
                yieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.approval.origin).toBe('flow');
        });

        it('does not return to the wrap step for a non-wrapped vault', () => {
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('does not return to the wrap step while a transaction is in flight', () => {
            const atApprove = yieldReducer(
                initSession('deposit', true),
                yieldActions.resolveWrappedNativeStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    step: 'wrap',
                }),
            );
            const withPendingTx = yieldReducer(
                atApprove,
                yieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'approve', txid: '0xabc', amount: '1' },
                }),
            );
            const state = yieldReducer(
                withPendingTx,
                yieldActions.returnToWrapStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it.each(['withdraw', 'redeem'] as const)(
            'moves a wrapped-native %s from action to unwrap',
            flowType => {
                const state = yieldReducer(
                    initSession(flowType, true),
                    yieldActions.completeAction({
                        flowType,
                        flowKey: FLOW_KEY,
                        amount: '10',
                    }),
                );

                expect(getSession(state, flowType)?.step).toBe('unwrap');
            },
        );

        it('stores the unwrapped amount and completes the flow', () => {
            const actionCompleteState = yieldReducer(
                initSession('withdraw', true),
                yieldActions.completeAction({
                    flowType: 'withdraw',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );
            const state = yieldReducer(
                actionCompleteState,
                yieldActions.resolveWrappedNativeStep({
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
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.completeApproval({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('10');
        });

        it('moves deposit to the action step when the approval step is skipped', () => {
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('carries the entered amount into the action step when the approval step is skipped', () => {
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '25',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('25');
        });

        it('keeps the committed amount when a skip carries an empty amount', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.enterModifyMode({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        amount: '25',
                    }),
                ),
                yieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('25');
        });

        it('ends the modify origin when the approval step is skipped so the action step re-guards allowance', () => {
            const modifying = yieldReducer(
                initSession('deposit'),
                yieldActions.enterModifyMode({ flowType: 'deposit', flowKey: FLOW_KEY }),
            );
            expect(getSession(modifying, 'deposit')?.approval.origin).toBe('modify');

            const state = yieldReducer(
                modifying,
                yieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '25',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.approval.origin).toBe('flow');
        });

        it('does not skip the wrap step when an allowance check resolves early', () => {
            const state = yieldReducer(
                initSession('deposit', true),
                yieldActions.skipApprovalStep({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });

        it('keeps deposit on the action step when the approval skip repeats', () => {
            // The allowance refetch after a confirmed approve tx dispatches skipApprovalStep
            // again; it must not advance the flow past the action step.
            const skipAction = yieldActions.skipApprovalStep({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
            });
            const state = yieldReducer(
                yieldReducer(initSession('deposit'), skipAction),
                skipAction,
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
        });

        it('completes deposit from the action step', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                yieldActions.completeAction({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    amount: '10',
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('complete');
            expect(getSession(state, 'deposit')?.result.completedAmount).toBe('10');
        });

        it('completes claim from the action step', () => {
            const state = yieldReducer(
                initSession('claim'),
                yieldActions.completeAction({
                    flowType: 'claim',
                    flowKey: FLOW_KEY,
                    amount: '0',
                }),
            );

            expect(getSession(state, 'claim')?.step).toBe('complete');
        });

        it('returns deposit to the approve step when entering modify mode', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.skipApprovalStep({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                ),
                yieldActions.enterModifyMode({
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
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.setPendingTx({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        tx: pendingTransaction,
                    }),
                ),
                yieldActions.enterModifyMode({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toEqual(
                pendingTransaction,
            );
        });
    });

    describe('session lifecycle', () => {
        it('disposes a session with no pending transaction', () => {
            const state = yieldReducer(
                initSession('deposit'),
                yieldActions.disposeSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')).toBeUndefined();
        });

        it('keeps a session whose transaction is still pending when disposed', () => {
            const pendingTransaction: YieldPendingTransactionState = {
                type: 'deposit',
                txid: '0xpendingtxid',
                amount: '100',
            };
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.setPendingTx({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        tx: pendingTransaction,
                    }),
                ),
                yieldActions.disposeSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toEqual(
                pendingTransaction,
            );
        });

        it('resets a session even while its transaction is still pending', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.setPendingTx({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        tx: { type: 'deposit', txid: '0xpendingtxid', amount: '100' },
                    }),
                ),
                yieldActions.resetSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toBeNull();
        });

        it('keeps a session whose approval already confirmed when disposed', () => {
            const approved = approveConfirmed();

            expect(getSession(approved, 'deposit')?.action.pendingTransaction).toBeNull();

            const state = yieldReducer(
                approved,
                yieldActions.disposeSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('100');
        });

        it('disposes a session whose flow completed', () => {
            const state = yieldReducer(
                yieldReducer(
                    yieldReducer(
                        approveConfirmed(),
                        yieldActions.setPendingTx({
                            flowType: 'deposit',
                            flowKey: FLOW_KEY,
                            tx: { type: 'deposit', txid: '0xdeposittxid', amount: '100' },
                        }),
                    ),
                    yieldActions.completeAction({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        amount: '100',
                    }),
                ),
                yieldActions.disposeSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')).toBeUndefined();
        });

        it('resumes a mid-flow session when the flow is entered again', () => {
            const state = yieldReducer(
                approveConfirmed(),
                yieldActions.enterSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('action');
            expect(getSession(state, 'deposit')?.action.amount).toBe('100');
        });

        it('resumes a session whose transaction is still pending when the flow is entered again', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.setPendingTx({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        tx: { type: 'deposit', txid: '0xpendingtxid', amount: '100' },
                    }),
                ),
                yieldActions.enterSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toEqual({
                type: 'deposit',
                txid: '0xpendingtxid',
                amount: '100',
            });
        });

        it('starts a session that never broadcast anything over when the flow is entered again', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit'),
                    yieldActions.enterModifyMode({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        amount: '100',
                    }),
                ),
                yieldActions.enterSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
            expect(getSession(state, 'deposit')?.action.amount).toBeNull();
            expect(getSession(state, 'deposit')?.approval.origin).toBe('flow');
        });

        it('opens a fresh wrapped-native deposit past the wrap step when the wrapped token is held', () => {
            const state = yieldReducer(
                initialStablecoinYieldState,
                yieldActions.enterSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    isWrappedNativeVault: true,
                    hasWrappedTokenBalance: true,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('approve');
        });

        it('opens a fresh wrapped-native deposit on the wrap step without a wrapped balance', () => {
            const state = yieldReducer(
                initialStablecoinYieldState,
                yieldActions.enterSession({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    isWrappedNativeVault: true,
                }),
            );

            expect(getSession(state, 'deposit')?.step).toBe('wrap');
        });
    });

    describe('pending transaction tracking', () => {
        const pendingDeposit = () =>
            yieldReducer(
                initSession('deposit'),
                yieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    tx: { type: 'deposit', txid: '0xdeposittxid', amount: '100' },
                }),
            );

        it('records the nonce of the pending transaction', () => {
            const state = yieldReducer(
                pendingDeposit(),
                yieldActions.setPendingTxNonce({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    txid: '0xdeposittxid',
                    nonce: 7,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction?.nonce).toBe(7);
        });

        it('ignores a nonce recorded for another transaction', () => {
            const state = yieldReducer(
                pendingDeposit(),
                yieldActions.setPendingTxNonce({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    txid: '0xothertxid',
                    nonce: 7,
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction?.nonce).toBeUndefined();
        });

        it('keeps following the recorded nonce when an RBF bump swaps the txid', () => {
            const state = yieldReducer(
                yieldReducer(
                    pendingDeposit(),
                    yieldActions.setPendingTxNonce({
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                        txid: '0xdeposittxid',
                        nonce: 7,
                    }),
                ),
                transactionsActions.replaceTransaction({
                    key: mockAccountKey(),
                    txid: '0xdeposittxid',
                    tx: { txid: '0xreplacementtxid' } as Parameters<
                        typeof transactionsActions.replaceTransaction
                    >[0]['tx'],
                }),
            );

            expect(getSession(state, 'deposit')?.action.pendingTransaction).toMatchObject({
                txid: '0xreplacementtxid',
                nonce: 7,
            });
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

        const storePrecomposed = (state: YieldState) =>
            yieldReducer(
                state,
                yieldActions.storePrecomposedTransaction({
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
            const state = yieldReducer(
                yieldReducer(
                    storePrecomposed(initialStablecoinYieldState),
                    yieldActions.storeSignedTransaction({ serializedTx }),
                ),
                yieldActions.discardTransaction(),
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

        const loadAllowance = (state: YieldState, amount: string) =>
            yieldReducer(
                state,
                yieldActions.setInitializedAllowance({ ...sessionPayload, amount }),
            );

        it('stores the read allowance', () => {
            const state = loadAllowance(initSession('deposit'), '100');

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('100');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('loaded');
        });

        it('clears the amount when the read fails', () => {
            const state = yieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                yieldActions.setAllowanceError(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBeNull();
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('error');
        });

        it('keeps the last amount when the allowance is only invalidated', () => {
            const state = yieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                yieldActions.invalidateAllowance(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('100');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('idle');
        });

        it('reports a zero allowance as loaded after a revoke', () => {
            const state = yieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                yieldActions.revokeSuccess(sessionPayload),
            );

            expect(getSession(state, 'deposit')?.approval.allowanceAmount).toBe('0');
            expect(getSession(state, 'deposit')?.approval.allowanceStatus).toBe('loaded');
        });

        it('ends the modify origin when a revoke completes', () => {
            const modifying = yieldReducer(
                loadAllowance(initSession('deposit'), '100'),
                yieldActions.enterModifyMode(sessionPayload),
            );
            expect(getSession(modifying, 'deposit')?.approval.origin).toBe('modify');

            const state = yieldReducer(modifying, yieldActions.revokeSuccess(sessionPayload));

            expect(getSession(state, 'deposit')?.approval.origin).toBe('flow');
        });

        // A confirmed approval dispatches these two back to back — the state the read must catch.
        it('leaves a wrapped-native deposit on the action step with an idle allowance', () => {
            const state = yieldReducer(
                yieldReducer(
                    loadAllowance(initSession('deposit', true), '100'),
                    yieldActions.resolveWrappedNativeStep({
                        ...sessionPayload,
                        step: 'wrap',
                    }),
                ),
                yieldActions.completeApproval({ ...sessionPayload, amount: '0.2' }),
            );
            const invalidated = yieldReducer(
                state,
                yieldActions.invalidateAllowance(sessionPayload),
            );

            expect(getSession(invalidated, 'deposit')?.step).toBe('action');
            expect(getSession(invalidated, 'deposit')?.approval.allowanceStatus).toBe('idle');
        });

        it('refuses to return to the wrap step while the allowance is being read', () => {
            const state = yieldReducer(
                yieldReducer(
                    initSession('deposit', true),
                    yieldActions.resolveWrappedNativeStep({
                        ...sessionPayload,
                        step: 'wrap',
                    }),
                ),
                yieldActions.startInitializingAllowance(sessionPayload),
            );
            const returned = yieldReducer(state, yieldActions.returnToWrapStep(sessionPayload));

            expect(getSession(returned, 'deposit')?.step).toBe('approve');
        });
    });
});
