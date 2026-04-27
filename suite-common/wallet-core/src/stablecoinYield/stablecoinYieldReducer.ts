import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type TransactionDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { isSafeObjectKey } from '@trezor/utils';

import type {
    YieldApproveModalState,
    YieldFlowStepId,
    YieldFlowType,
    YieldPendingTransactionState,
} from './stablecoinYieldTypes';

type StablecoinYieldTranslationKey = string;

type StablecoinYieldSerializedTx = {
    tx: string;
    symbol: NetworkSymbol;
};

export const STABLECOIN_YIELD_PREFIX = '@suite-common/wallet-core/stablecoin-yield';

export type StablecoinYieldTxReviewState = {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    serializedTx?: StablecoinYieldSerializedTx;
    accountKey?: AccountKey;
};

export type StablecoinYieldSessionState = {
    step: YieldFlowStepId;
    error: StablecoinYieldTranslationKey | null;
    approval: {
        amount: string | null;
        modalState: YieldApproveModalState | null;
        submitTxHashTransactionId: string | null;
        isSubmitting: boolean;
        isPending: boolean;
        isModifyMode: boolean;
        lastApprovedAmount: string;
        isRevokeRequired: boolean;
        revokeTransactions: TransactionDto[] | null;
        approvedSpender: string | null;
    };
    action: {
        amount: string | null;
        isSubmitting: boolean;
        pendingTransaction: YieldPendingTransactionState | null;
        pendingReceiptAmount: string;
    };
    result: {
        completedAmount: string;
        completedReceiptAmount: string;
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
        amount: null,
        modalState: null,
        submitTxHashTransactionId: null,
        isSubmitting: false,
        isPending: false,
        isModifyMode: false,
        lastApprovedAmount: '',
        isRevokeRequired: false,
        revokeTransactions: null,
        approvedSpender: null,
    },
    action: {
        amount: null,
        isSubmitting: false,
        pendingTransaction: null,
        pendingReceiptAmount: '',
    },
    result: {
        completedAmount: '0',
        completedReceiptAmount: '0',
    },
};

export const initialStablecoinYieldTxReviewState: StablecoinYieldTxReviewState = {
    precomposedTx: undefined,
    precomposedForm: undefined,
    serializedTx: undefined,
    accountKey: undefined,
};

export const initialStablecoinYieldState: StablecoinYieldState = {
    supply: Object.create(null),
    withdraw: Object.create(null),
    txReview: initialStablecoinYieldTxReviewState,
};

const createInitialStablecoinYieldSessionState = (): StablecoinYieldSessionState => ({
    ...initialStablecoinYieldSessionState,
    approval: { ...initialStablecoinYieldSessionState.approval },
    action: { ...initialStablecoinYieldSessionState.action },
    result: { ...initialStablecoinYieldSessionState.result },
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
                state[flowType][sessionKey] = createInitialStablecoinYieldSessionState();
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
                createInitialStablecoinYieldSessionState();
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
                    txHashTransactionId: string | null;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.modalState = action.payload.modalState;
                session.approval.submitTxHashTransactionId = action.payload.txHashTransactionId;
            });
        },
        closeApprovalModal(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.modalState = null;
                session.approval.submitTxHashTransactionId = null;
                session.error = null;
            });
        },
        setApprovalResponse(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    approvedSpender: string | null;
                    revokeTransactions: TransactionDto[] | null;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                if (action.payload.approvedSpender !== null) {
                    session.approval.approvedSpender = action.payload.approvedSpender;
                }
                session.approval.revokeTransactions = action.payload.revokeTransactions;
            });
        },
        setRevokeRequired(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isRevokeRequired = true;
            });
        },
        clearApprovalTransition(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.revokeTransactions = null;
            });
        },
        startSubmittingApproval(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    amount: string;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.amount = action.payload.amount;
                session.approval.isSubmitting = true;
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
        enterModifyMode(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = true;
                session.approval.modalState = null;
                session.action.pendingTransaction = null;
                session.approval.submitTxHashTransactionId = null;
                session.error = null;
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
                session.approval.lastApprovedAmount = action.payload.amount;
                session.action.amount = action.payload.amount;
                session.approval.isPending = false;
                session.action.pendingTransaction = null;
                session.approval.revokeTransactions = null;
                session.step = 'action';
            });
        },
        skipApprovalStep(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.step = 'action';
            });
        },
        cancelModification(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.amount = null;
                session.approval.lastApprovedAmount = '';
                session.approval.isRevokeRequired = false;
                session.approval.revokeTransactions = null;
                session.step = 'approve';
            });
        },
        revokeSuccess(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.lastApprovedAmount = '';
                session.approval.isRevokeRequired = false;
                session.approval.isPending = false;
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
                session.error = null;
            });
        },
        finishSubmittingAction(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.isSubmitting = false;
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
                session.approval.isPending =
                    action.payload.tx.type === 'approve' ||
                    action.payload.tx.type === 'revoke' ||
                    action.payload.tx.type === 'revoke-only';
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
                session.result.completedAmount = action.payload.amount;
                session.result.completedReceiptAmount = session.action.pendingReceiptAmount;
                session.action.pendingTransaction = null;
                session.step = 'complete';
            });
        },
        transactionFailed(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.pendingTransaction = null;
                session.approval.isPending = false;
                session.error = 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';
            });
        },
        goToStep(
            state,
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & {
                    step: YieldFlowStepId;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.step = action.payload.step;
            });
        },
        storePrecomposedTransaction(
            state,
            action: PayloadAction<{
                precomposedTx: PrecomposedTransactionFinal;
                precomposedForm: FormState;
                accountKey: AccountKey;
            }>,
        ) {
            state.txReview.precomposedTx = action.payload.precomposedTx;
            state.txReview.precomposedForm = action.payload.precomposedForm;
            state.txReview.accountKey = action.payload.accountKey;
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
            state.txReview.serializedTx = undefined;
            state.txReview.accountKey = undefined;
        },
    },
});

export const stablecoinYieldActions = stablecoinYieldSlice.actions;
export const stablecoinYieldReducer = stablecoinYieldSlice.reducer;
