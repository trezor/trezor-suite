import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import { isSafeObjectKey } from '@trezor/utils';

import { getNextYieldFlowStep, getYieldFlowStepSequence } from './utils/yieldUtils';
import { YIELD_PREFIX } from './yieldConstants';
import {
    type WrappedNativeStepId,
    YIELD_FLOW_TYPES,
    type YieldApproveModalState,
    type YieldClaimUnsignedTransaction,
    type YieldFlowCompleteRewardItem,
    type YieldFlowStepId,
    type YieldFlowType,
    type YieldPendingTransactionState,
    type YieldPositionFlowType,
} from './yieldTypes';
import { transactionsActions } from '../transactions/transactionsActions';

// Message ids must exist in the desktop `suite/intl` messages — the desktop app renders
// `session.error` directly via `<Translation>`.
export type YieldTranslationKey =
    | 'TR_EARN_YIELD_ERROR_CLAIM_REVIEW_MISMATCH'
    | 'TR_EARN_YIELD_ERROR_FEE_ESTIMATION'
    | 'TR_EARN_YIELD_ERROR_GENERIC'
    | 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT'
    | 'TR_EARN_YIELD_ERROR_PUSH_FAILED'
    | 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';

type YieldSerializedTx = {
    tx: string;
    symbol: NetworkSymbol;
};

export type YieldActionReviewState =
    | {
          type: YieldPositionFlowType;
          amount: string;
          receiptAmount: string;
          unsignedTransaction: string;
      }
    | {
          type: 'claim';
          rewards: YieldFlowCompleteRewardItem[];
          unsignedTransaction: YieldClaimUnsignedTransaction;
      }
    | {
          type: WrappedNativeStepId;
          amount: string;
          unsignedTransaction: string;
      };

type YieldStoreActionReviewDataPayload =
    | (YieldSessionActionPayload & {
          flowType: YieldPositionFlowType;
          amount: string;
          receiptAmount: string;
          unsignedTransaction: string;
      })
    | (YieldSessionActionPayload & {
          flowType: 'claim';
          rewards: YieldFlowCompleteRewardItem[];
          unsignedTransaction: YieldClaimUnsignedTransaction;
      });

export type YieldAllowanceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type YieldTxReviewState = {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    availableRewards?: YieldClaimReward[];
    serializedTx?: YieldSerializedTx;
    accountKey?: AccountKey;
    flowKey?: string;
    flowType?: YieldFlowType;
    createdTimestamp?: number;
};

export type YieldSessionState = {
    step: YieldFlowStepId;
    isWrappedNativeVault: boolean;
    /**
     * Set once the session broadcasts a transaction and never cleared while the flow runs.
     * `action.pendingTransaction` only marks a transaction still in flight — every resolution
     * (`completeApproval`, `resolveWrappedNativeStep`, `completeAction`, …) clears it — so this is
     * what tells a session that already moved on-chain apart from an untouched one.
     */
    hasBroadcastTransaction: boolean;
    error: YieldTranslationKey | null;
    approval: {
        allowanceAmount: string | null;
        modalState: YieldApproveModalState | null;
        isSubmitting: boolean;
        allowanceStatus: YieldAllowanceStatus;
        /** Set when the step was left without approving, i.e. the allowance already covered it. */
        isSkipped: boolean;
        isModifyMode: boolean;
        isRevokeRequired: boolean;
    };
    action: {
        amount: string | null;
        isSubmitting: boolean;
        pendingTransaction: YieldPendingTransactionState | null;
        pendingReceiptAmount: string;
        review: YieldActionReviewState | null;
    };
    result: {
        completedAmount: string;
        completedReceiptAmount: string;
        completedRewards: YieldFlowCompleteRewardItem[];
        unwrappedAmount: string | null;
        wrappedAmount: string | null;
    };
};

export type YieldState = {
    txReview: YieldTxReviewState;
} & Record<YieldFlowType, Record<string, YieldSessionState>>;

export type YieldRootState = {
    wallet: {
        stablecoinYield: YieldState;
    };
};

type YieldSessionActionPayload = {
    flowType: YieldFlowType;
    flowKey: string;
};

export const initialStablecoinYieldSessionState: YieldSessionState = {
    step: 'approve',
    isWrappedNativeVault: false,
    hasBroadcastTransaction: false,
    error: null,
    approval: {
        allowanceAmount: null,
        modalState: null,
        isSubmitting: false,
        isSkipped: false,
        allowanceStatus: 'idle',
        isModifyMode: false,
        isRevokeRequired: false,
    },
    action: {
        amount: null,
        isSubmitting: false,
        pendingTransaction: null,
        pendingReceiptAmount: '',
        review: null,
    },
    result: {
        completedAmount: '0',
        completedReceiptAmount: '0',
        completedRewards: [],
        unwrappedAmount: null,
        wrappedAmount: null,
    },
};

export const initialStablecoinYieldTxReviewState: YieldTxReviewState = {
    precomposedTx: undefined,
    precomposedForm: undefined,
    availableRewards: undefined,
    serializedTx: undefined,
    accountKey: undefined,
    flowKey: undefined,
    flowType: undefined,
    createdTimestamp: undefined,
};

export const initialStablecoinYieldState: YieldState = {
    deposit: Object.create(null),
    withdraw: Object.create(null),
    redeem: Object.create(null),
    claim: Object.create(null),
    txReview: initialStablecoinYieldTxReviewState,
};

const createInitialYieldSessionState = (
    flowType: YieldFlowType,
    isWrappedNativeVault = false,
): YieldSessionState => ({
    ...initialStablecoinYieldSessionState,
    step: getYieldFlowStepSequence({ flowType, isWrappedNativeVault })[0],
    isWrappedNativeVault,
    approval: { ...initialStablecoinYieldSessionState.approval },
    action: { ...initialStablecoinYieldSessionState.action },
    result: {
        ...initialStablecoinYieldSessionState.result,
        completedRewards: [...initialStablecoinYieldSessionState.result.completedRewards],
    },
});

export const getYieldSessionKey = (flowKey: string) => `yield-session:${flowKey}`;

/**
 * Whether re-entering the flow should pick this session up instead of starting it over.
 *
 * A session becomes resumable the moment it broadcasts a transaction and stays that way until the
 * flow completes: leaving the page must not throw away on-chain progress the user cannot redo (a
 * granted approval, a finished wrap, an amount already withdrawn and waiting to be unwrapped), and
 * a transaction still in flight has to stay tracked — the pending panel, the duplicate-submit
 * guard, the completion into the next step and `replaceTransaction` following an RBF all read it.
 */
export const isYieldSessionResumable = (session: YieldSessionState | undefined): boolean => {
    if (!session) return false;
    if (session.action.pendingTransaction) return true;

    return session.hasBroadcastTransaction && session.step !== 'complete';
};

const withSession = (
    state: YieldState,
    { flowType, flowKey }: YieldSessionActionPayload,
    updater: (session: YieldSessionState) => void,
) => {
    if (!isSafeObjectKey(flowKey)) {
        return;
    }

    const session = state[flowType][getYieldSessionKey(flowKey)];

    if (!session) {
        return;
    }

    updater(session);
};

const yieldSlice = createSlice({
    name: YIELD_PREFIX,
    initialState: initialStablecoinYieldState,
    reducers: {
        initSession(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload & { isWrappedNativeVault?: boolean }>,
        ) {
            const { flowType, flowKey, isWrappedNativeVault } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            const sessionKey = getYieldSessionKey(flowKey);

            if (!state[flowType][sessionKey]) {
                state[flowType][sessionKey] = createInitialYieldSessionState(
                    flowType,
                    isWrappedNativeVault,
                );
            }
        },
        /** Opens the flow: resumes a session that is still mid-flow, otherwise starts a fresh one. */
        enterSession(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    isWrappedNativeVault?: boolean;
                    hasWrappedTokenBalance?: boolean;
                }
            >,
        ) {
            const { flowType, flowKey, isWrappedNativeVault, hasWrappedTokenBalance } =
                action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            const sessionKey = getYieldSessionKey(flowKey);

            if (isYieldSessionResumable(state[flowType][sessionKey])) {
                return;
            }

            const session = createInitialYieldSessionState(flowType, isWrappedNativeVault);

            // Only a wrapped-native deposit opens on the wrap step, and there is nothing to wrap
            // when the wrapped token is already held — mirrors `resolveWrappedNativeStep`.
            if (session.step === 'wrap' && hasWrappedTokenBalance) {
                session.step = getNextYieldFlowStep(flowType, 'wrap', session.isWrappedNativeVault);
            }

            state[flowType][sessionKey] = session;
        },
        disposeSession(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            const sessionKey = getYieldSessionKey(flowKey);

            // A session that is mid-flow must survive its page unmounting so re-entering the flow
            // resumes it (see `isYieldSessionResumable`); it is dropped once the flow
            // completes, or never stored beyond the page when nothing was broadcast.
            if (isYieldSessionResumable(state[flowType][sessionKey])) {
                return;
            }

            delete state[flowType][sessionKey];
        },
        resetSession(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload & { isWrappedNativeVault?: boolean }>,
        ) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            const sessionKey = getYieldSessionKey(flowKey);
            const isWrappedNativeVault =
                action.payload.isWrappedNativeVault ??
                state[flowType][sessionKey]?.isWrappedNativeVault ??
                false;

            state[flowType][sessionKey] = createInitialYieldSessionState(
                flowType,
                isWrappedNativeVault,
            );
        },
        setError(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    error: YieldTranslationKey;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.error = action.payload.error;
            });
        },
        clearError(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.error = null;
            });
        },
        openApprovalModal(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    modalState: YieldApproveModalState;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.modalState = action.payload.modalState;
            });
        },
        closeApprovalModal(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.modalState = null;
                session.error = null;
            });
        },
        setRevokeRequired(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isRevokeRequired = true;
            });
        },
        startSubmittingApproval(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = true;
                session.approval.modalState = null;
                session.approval.isRevokeRequired = false;
                session.error = null;
            });
        },
        finishSubmittingApproval(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = false;
            });
        },
        startInitializingAllowance(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.allowanceStatus = 'loading';
            });
        },
        setInitializedAllowance(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload & { amount: string }>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.allowanceAmount = action.payload.amount;
                session.approval.allowanceStatus = 'loaded';
            });
        },
        setAllowanceError(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.allowanceAmount = null;
                session.approval.allowanceStatus = 'error';
            });
        },
        invalidateAllowance(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.allowanceStatus = 'idle';
            });
        },
        enterModifyMode(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload & { amount?: string }>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = true;
                session.approval.modalState = null;
                // The pendingTransaction is intentionally preserved — an in-flight action tx must
                // stay tracked so its confirmation is still processed into `completeAction`.
                session.action.review = null;
                session.error = null;
                session.action.amount = action.payload.amount ?? session.action.amount;
                session.step = 'approve';
            });
        },
        completeApproval(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    amount: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                // Approval completion only ever originates from the approve step (modify mode
                // regresses there first) — the guard keeps a stray dispatch from yanking the
                // flow out of another step.
                if (session.step !== 'approve') {
                    return;
                }

                session.approval.isModifyMode = false;
                session.approval.modalState = null;
                session.approval.isRevokeRequired = false;
                session.approval.isSkipped = false;
                session.action.amount = action.payload.amount;
                session.action.pendingTransaction = null;
                session.action.review = null;
                session.step = getNextYieldFlowStep(
                    action.payload.flowType,
                    'approve',
                    session.isWrappedNativeVault,
                );
            });
        },
        skipApprovalStep(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    amount?: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                if (session.step !== 'approve') {
                    return;
                }

                // A user-triggered skip carries the entered amount so the action step opens
                // with it; the automatic allowance-check skip omits it and keeps the existing one.
                if (action.payload.amount) {
                    session.action.amount = action.payload.amount;
                }
                // Leaving the approve step forward clears modify mode (mirrors `completeApproval`)
                // so the action step's insufficient-allowance guard applies — otherwise a skip
                // with an amount above the current allowance would slip past it.
                session.approval.isModifyMode = false;
                session.approval.isRevokeRequired = false;
                session.approval.isSkipped = true;
                session.step = getNextYieldFlowStep(
                    action.payload.flowType,
                    'approve',
                    session.isWrappedNativeVault,
                );
            });
        },
        resolveWrappedNativeStep(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    step: WrappedNativeStepId;
                    amount?: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                if (session.step !== action.payload.step) {
                    return;
                }

                session.action.pendingTransaction = null;
                if (action.payload.step === 'unwrap') {
                    session.result.unwrappedAmount = action.payload.amount ?? null;
                }

                if (action.payload.step === 'wrap' && action.payload.amount) {
                    session.action.amount = action.payload.amount;
                    // Record that a wrap happened so the completed deposit can be shown in the
                    // native asset (the user's original asset), mirroring `unwrappedAmount`.
                    session.result.wrappedAmount = action.payload.amount;
                }
                session.step = getNextYieldFlowStep(
                    action.payload.flowType,
                    action.payload.step,
                    session.isWrappedNativeVault,
                );
            });
        },
        returnToWrapStep(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                // Editing the finished wrap step offers another wrap round. Only meaningful for
                // a wrapped-native deposit, from a later pre-complete step, and never while an
                // approval or action operation is in flight — a regression during e.g.
                // `submitYieldApproveThunk` would let its completion yank the flow out of the
                // re-entered wrap step.
                if (
                    action.payload.flowType !== 'deposit' ||
                    !session.isWrappedNativeVault ||
                    (session.step !== 'approve' && session.step !== 'action') ||
                    session.approval.isSubmitting ||
                    session.approval.modalState !== null ||
                    session.approval.allowanceStatus === 'loading' ||
                    session.action.isSubmitting ||
                    session.action.pendingTransaction !== null
                ) {
                    return;
                }

                session.step = 'wrap';
            });
        },
        revokeSuccess(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.allowanceAmount = '0';
                session.approval.allowanceStatus = 'loaded';
                session.approval.isRevokeRequired = false;
                session.action.pendingTransaction = null;
            });
        },
        startSubmittingAction(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    amount: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.action.amount = action.payload.amount;
                session.action.isSubmitting = true;
                session.action.review = null;
                session.error = null;
            });
        },
        finishSubmittingAction(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.action.isSubmitting = false;
            });
        },
        startSubmittingWrappedNative(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.action.isSubmitting = true;
                session.error = null;
            });
        },
        storeActionReviewData(
            state: YieldState,
            action: PayloadAction<YieldStoreActionReviewDataPayload>,
        ) {
            withSession(state, action.payload, session => {
                if (action.payload.flowType === 'claim') {
                    session.action.review = {
                        type: 'claim',
                        rewards: action.payload.rewards,
                        unsignedTransaction: action.payload.unsignedTransaction,
                    };

                    return;
                }

                session.action.amount = action.payload.amount;
                session.action.review = {
                    type: action.payload.flowType,
                    amount: action.payload.amount,
                    receiptAmount: action.payload.receiptAmount,
                    unsignedTransaction: action.payload.unsignedTransaction,
                };
            });
        },
        storeWrappedNativeReviewData(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    step: WrappedNativeStepId;
                    amount: string;
                    unsignedTransaction: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.action.review = {
                    type: action.payload.step,
                    amount: action.payload.amount,
                    unsignedTransaction: action.payload.unsignedTransaction,
                };
            });
        },
        setPendingTx(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    tx: YieldPendingTransactionState;
                    receiptAmount?: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.hasBroadcastTransaction = true;
                session.action.pendingTransaction = action.payload.tx;
                session.action.pendingReceiptAmount =
                    action.payload.receiptAmount ?? session.action.pendingReceiptAmount;
            });
        },
        /**
         * Records the nonce of the pending transaction once the account lists it, so the session
         * can follow an RBF replacement even after the original transaction is dropped from the
         * account and the page tracking it has been left and reopened.
         */
        setPendingTxNonce(
            state: YieldState,
            action: PayloadAction<YieldSessionActionPayload & { txid: string; nonce: number }>,
        ) {
            withSession(state, action.payload, session => {
                if (session.action.pendingTransaction?.txid !== action.payload.txid) {
                    return;
                }

                session.action.pendingTransaction.nonce = action.payload.nonce;
            });
        },
        completeAction(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    amount: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                if (session.action.review?.type === 'claim') {
                    session.result.completedRewards = session.action.review.rewards;
                } else {
                    session.result.completedAmount = action.payload.amount;
                    session.result.completedReceiptAmount = session.action.pendingReceiptAmount;
                }

                session.action.pendingTransaction = null;
                session.action.review = null;
                session.step = getNextYieldFlowStep(
                    action.payload.flowType,
                    'action',
                    session.isWrappedNativeVault,
                );
            });
        },
        transactionFailed(state: YieldState, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.pendingTransaction = null;
                session.error = 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';
            });
        },
        storePrecomposedTransaction(
            state: YieldState,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    precomposedTx: PrecomposedTransactionFinal;
                    precomposedForm: FormState;
                    availableRewards?: YieldClaimReward[];
                    accountKey: AccountKey;
                }
            >,
        ) {
            state.txReview.precomposedTx = action.payload.precomposedTx;
            state.txReview.precomposedForm = action.payload.precomposedForm;
            state.txReview.availableRewards = action.payload.availableRewards;
            state.txReview.accountKey = action.payload.accountKey;
            state.txReview.flowKey = action.payload.flowKey;
            state.txReview.flowType = action.payload.flowType;
            state.txReview.createdTimestamp = new Date().getTime();
            state.txReview.serializedTx = undefined;
        },
        storeSignedTransaction(
            state: YieldState,
            action: PayloadAction<{ serializedTx: YieldSerializedTx }>,
        ) {
            state.txReview.serializedTx = action.payload.serializedTx;
        },
        discardTransaction(state: YieldState) {
            state.txReview.precomposedTx = undefined;
            state.txReview.precomposedForm = undefined;
            state.txReview.availableRewards = undefined;
            state.txReview.serializedTx = undefined;
            state.txReview.accountKey = undefined;
            state.txReview.flowKey = undefined;
            state.txReview.flowType = undefined;
            state.txReview.createdTimestamp = undefined;
        },
    },
    extraReducers: builder => {
        builder.addCase(transactionsActions.replaceTransaction, (state, { payload }) => {
            const { txid: prevTxid, tx } = payload;
            YIELD_FLOW_TYPES.forEach(flowType => {
                const bucket = state[flowType];
                Object.values(bucket).forEach(session => {
                    if (session.action.pendingTransaction?.txid === prevTxid) {
                        session.action.pendingTransaction.txid = tx.txid;
                    }
                });
            });
        });
    },
});

export const yieldActions = yieldSlice.actions;
export const yieldReducer = yieldSlice.reducer;
