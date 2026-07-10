import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import { isSafeObjectKey } from '@trezor/utils';

import { STABLECOIN_YIELD_PREFIX, YIELD_FLOW_STEP_SEQUENCES } from './stablecoinYieldConstants';
import {
    type StablecoinYieldClaimUnsignedTransaction,
    type YieldApproveModalState,
    type YieldFlowCompleteRewardItem,
    type YieldFlowStepId,
    type YieldFlowType,
    type YieldPendingTransactionState,
    type YieldPositionFlowType,
} from './stablecoinYieldTypes';
import { getNextYieldFlowStep } from './stablecoinYieldUtils';
import { transactionsActions } from '../transactions/transactionsActions';

// Message ids must exist in the desktop `suite/intl` messages — the desktop app renders
// `session.error` directly via `<Translation>`.
type StablecoinYieldTranslationKey =
    | 'TR_EARN_YIELD_ERROR_GENERIC'
    | 'TR_EARN_YIELD_ERROR_PASSPHRASE_INCORRECT'
    | 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';

type StablecoinYieldSerializedTx = {
    tx: string;
    symbol: NetworkSymbol;
};

export type StablecoinYieldActionReviewState =
    | {
          type: YieldPositionFlowType;
          amount: string;
          receiptAmount: string;
          unsignedTransaction: string;
      }
    | {
          type: 'claim';
          rewards: YieldFlowCompleteRewardItem[];
          unsignedTransaction: StablecoinYieldClaimUnsignedTransaction;
      };

type StablecoinYieldStoreActionReviewDataPayload =
    | (StablecoinYieldSessionActionPayload & {
          flowType: YieldPositionFlowType;
          amount: string;
          receiptAmount: string;
          unsignedTransaction: string;
      })
    | (StablecoinYieldSessionActionPayload & {
          flowType: 'claim';
          rewards: YieldFlowCompleteRewardItem[];
          unsignedTransaction: StablecoinYieldClaimUnsignedTransaction;
      });

export type YieldAllowanceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type StablecoinYieldTxReviewState = {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    availableRewards?: YieldClaimReward[];
    serializedTx?: StablecoinYieldSerializedTx;
    accountKey?: AccountKey;
    flowKey?: string;
    flowType?: YieldFlowType;
    createdTimestamp?: number;
};

export type StablecoinYieldSessionState = {
    step: YieldFlowStepId;
    error: StablecoinYieldTranslationKey | null;
    approval: {
        allowanceAmount: string | null;
        modalState: YieldApproveModalState | null;
        isSubmitting: boolean;
        allowanceStatus: YieldAllowanceStatus;
        isModifyMode: boolean;
        isRevokeRequired: boolean;
    };
    action: {
        amount: string | null;
        isSubmitting: boolean;
        pendingTransaction: YieldPendingTransactionState | null;
        pendingReceiptAmount: string;
        review: StablecoinYieldActionReviewState | null;
    };
    result: {
        completedAmount: string;
        completedReceiptAmount: string;
        completedRewards: YieldFlowCompleteRewardItem[];
    };
};

export type StablecoinYieldState = {
    txReview: StablecoinYieldTxReviewState;
} & Record<YieldFlowType, Record<string, StablecoinYieldSessionState>>;

export type StablecoinYieldRootState = {
    wallet: {
        stablecoinYield: StablecoinYieldState;
    };
};

type StablecoinYieldSessionActionPayload = {
    flowType: YieldFlowType;
    flowKey: string;
};

export const initialStablecoinYieldSessionState: StablecoinYieldSessionState = {
    step: 'approve',
    error: null,
    approval: {
        allowanceAmount: null,
        modalState: null,
        isSubmitting: false,
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
    },
};

export const initialStablecoinYieldTxReviewState: StablecoinYieldTxReviewState = {
    precomposedTx: undefined,
    precomposedForm: undefined,
    availableRewards: undefined,
    serializedTx: undefined,
    accountKey: undefined,
    flowKey: undefined,
    flowType: undefined,
    createdTimestamp: undefined,
};

export const initialStablecoinYieldState: StablecoinYieldState = {
    deposit: Object.create(null),
    withdraw: Object.create(null),
    redeem: Object.create(null),
    claim: Object.create(null),
    txReview: initialStablecoinYieldTxReviewState,
};

const createInitialStablecoinYieldSessionState = (
    flowType: YieldFlowType,
): StablecoinYieldSessionState => ({
    ...initialStablecoinYieldSessionState,
    step: YIELD_FLOW_STEP_SEQUENCES[flowType][0],
    approval: { ...initialStablecoinYieldSessionState.approval },
    action: { ...initialStablecoinYieldSessionState.action },
    result: {
        ...initialStablecoinYieldSessionState.result,
        completedRewards: [...initialStablecoinYieldSessionState.result.completedRewards],
    },
});

export const getStablecoinYieldSessionKey = (flowKey: string) => `yield-session:${flowKey}`;

const withSession = (
    state: StablecoinYieldState,
    { flowType, flowKey }: StablecoinYieldSessionActionPayload,
    updater: (session: StablecoinYieldSessionState) => void,
) => {
    if (!isSafeObjectKey(flowKey)) {
        return;
    }

    const session = state[flowType][getStablecoinYieldSessionKey(flowKey)];

    if (!session) {
        return;
    }

    updater(session);
};

export const stablecoinYieldSlice = createSlice({
    name: STABLECOIN_YIELD_PREFIX,
    initialState: initialStablecoinYieldState,
    reducers: {
        initSession(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            const sessionKey = getStablecoinYieldSessionKey(flowKey);

            if (!state[flowType][sessionKey]) {
                state[flowType][sessionKey] = createInitialStablecoinYieldSessionState(flowType);
            }
        },
        disposeSession(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            delete state[flowType][getStablecoinYieldSessionKey(flowKey)];
        },
        resetSession(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            state[flowType][getStablecoinYieldSessionKey(flowKey)] =
                createInitialStablecoinYieldSessionState(flowType);
        },
        setError(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    error: StablecoinYieldTranslationKey;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.error = action.payload.error;
            });
        },
        clearError(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.error = null;
            });
        },
        openApprovalModal(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    modalState: YieldApproveModalState;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.modalState = action.payload.modalState;
            });
        },
        closeApprovalModal(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.modalState = null;
                session.error = null;
            });
        },
        setRevokeRequired(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isRevokeRequired = true;
            });
        },
        startSubmittingApproval(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = true;
                session.approval.modalState = null;
                session.approval.isRevokeRequired = false;
                session.error = null;
            });
        },
        finishSubmittingApproval(
            state,
            action: PayloadAction<StablecoinYieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = false;
            });
        },
        startInitializingAllowance(
            state,
            action: PayloadAction<StablecoinYieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.allowanceStatus = 'loading';
            });
        },
        setInitializedAllowance(
            state,
            action: PayloadAction<StablecoinYieldSessionActionPayload & { amount: string }>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.allowanceAmount = action.payload.amount;
                session.approval.allowanceStatus = 'loaded';
            });
        },
        setAllowanceError(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.allowanceAmount = null;
                session.approval.allowanceStatus = 'error';
            });
        },
        invalidateAllowance(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.allowanceStatus = 'idle';
            });
        },
        enterModifyMode(
            state,
            action: PayloadAction<StablecoinYieldSessionActionPayload & { amount?: string }>,
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
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    amount: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.modalState = null;
                session.approval.isRevokeRequired = false;
                session.action.amount = action.payload.amount;
                session.action.pendingTransaction = null;
                session.action.review = null;
                session.step = getNextYieldFlowStep(action.payload.flowType, 'approve');
            });
        },
        skipApprovalStep(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.step = getNextYieldFlowStep(action.payload.flowType, 'approve');
            });
        },
        revokeSuccess(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.allowanceAmount = '0';
                session.approval.allowanceStatus = 'loaded';
                session.approval.isRevokeRequired = false;
                session.action.pendingTransaction = null;
            });
        },
        startSubmittingAction(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
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
        finishSubmittingAction(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.isSubmitting = false;
            });
        },
        storeActionReviewData(
            state,
            action: PayloadAction<StablecoinYieldStoreActionReviewDataPayload>,
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
        setPendingTx(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    tx: YieldPendingTransactionState;
                    receiptAmount?: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.action.pendingTransaction = action.payload.tx;
                session.action.pendingReceiptAmount =
                    action.payload.receiptAmount ?? session.action.pendingReceiptAmount;
            });
        },
        completeAction(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
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
                session.step = getNextYieldFlowStep(action.payload.flowType, 'action');
            });
        },
        transactionFailed(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.pendingTransaction = null;
                session.error = 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';
            });
        },
        storePrecomposedTransaction(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
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
            state,
            action: PayloadAction<{ serializedTx: StablecoinYieldSerializedTx }>,
        ) {
            state.txReview.serializedTx = action.payload.serializedTx;
        },
        discardTransaction(state) {
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
            (['deposit', 'withdraw', 'redeem', 'claim'] as const).forEach(flowType => {
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

export const stablecoinYieldActions = stablecoinYieldSlice.actions;
export const stablecoinYieldReducer = stablecoinYieldSlice.reducer;
