import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type TranslationKey } from '@suite/intl';
import { type TransactionDto } from '@suite-common/earn-stablecoin-api';
import { type YieldFlowType } from '@suite-common/suite-types';
import { isSafeObjectKey } from '@trezor/utils';

import { type AppState } from 'src/types/suite';

import type {
    YieldApproveModalState,
    YieldFlowStepId,
    YieldPendingTransactionState,
} from './types';

export const YIELD_PREFIX = '@suite/yield';

export type YieldSessionState = {
    step: YieldFlowStepId;
    error: TranslationKey | null;
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

export type YieldState = Record<YieldFlowType, Record<string, YieldSessionState>>;

type YieldSessionActionPayload = {
    flowType: YieldFlowType;
    flowKey: string;
};

export const initialYieldSessionState: YieldSessionState = {
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

export const initialYieldState: YieldState = {
    supply: {},
    withdraw: {},
};

const createInitialYieldSessionState = (): YieldSessionState => ({
    ...initialYieldSessionState,
    approval: { ...initialYieldSessionState.approval },
    action: { ...initialYieldSessionState.action },
    result: { ...initialYieldSessionState.result },
});

const withSession = (
    state: YieldState,
    { flowType, flowKey }: YieldSessionActionPayload,
    updater: (session: YieldSessionState) => void,
) => {
    if (!isSafeObjectKey(flowKey)) {
        return;
    }

    const session = state[flowType][flowKey];

    if (!session) {
        return;
    }

    updater(session);
};

export const yieldSlice = createSlice({
    name: YIELD_PREFIX,
    initialState: initialYieldState,
    reducers: {
        initSession(state, action: PayloadAction<YieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            if (!state[flowType][flowKey]) {
                state[flowType][flowKey] = createInitialYieldSessionState();
            }
        },
        disposeSession(state, action: PayloadAction<YieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            delete state[flowType][flowKey];
        },
        resetSession(state, action: PayloadAction<YieldSessionActionPayload>) {
            const { flowType, flowKey } = action.payload;

            if (!isSafeObjectKey(flowKey)) {
                return;
            }

            state[flowType][flowKey] = createInitialYieldSessionState();
        },
        setError(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    error: TranslationKey;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.error = action.payload.error;
            });
        },
        clearError(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.error = null;
            });
        },
        openApprovalModal(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
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
        closeApprovalModal(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.modalState = null;
                session.approval.submitTxHashTransactionId = null;
                session.error = null;
            });
        },
        setApprovalResponse(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    approvedSpender: string | null;
                    revokeTransactions: TransactionDto[] | null;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.approval.approvedSpender = action.payload.approvedSpender;
                session.approval.revokeTransactions = action.payload.revokeTransactions;
            });
        },
        setRevokeRequired(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isRevokeRequired = true;
            });
        },
        clearApprovalTransition(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.revokeTransactions = null;
            });
        },
        startSubmittingApproval(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
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
        finishSubmittingApproval(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = false;
            });
        },
        enterModifyMode(state, action: PayloadAction<YieldSessionActionPayload>) {
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
                YieldSessionActionPayload & {
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
        skipApprovalStep(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.step = 'action';
            });
        },
        cancelModification(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.amount = null;
                session.approval.lastApprovedAmount = '';
                session.approval.isRevokeRequired = false;
                session.approval.revokeTransactions = null;
                session.step = 'approve';
            });
        },
        revokeSuccess(state, action: PayloadAction<YieldSessionActionPayload>) {
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
                YieldSessionActionPayload & {
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
        finishSubmittingAction(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.isSubmitting = false;
            });
        },
        setPendingTx(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
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
                YieldSessionActionPayload & {
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
        transactionFailed(state, action: PayloadAction<YieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.action.pendingTransaction = null;
                session.approval.isPending = false;
                session.error = 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';
            });
        },
        goToStep(
            state,
            action: PayloadAction<
                YieldSessionActionPayload & {
                    step: YieldFlowStepId;
                }
            >,
        ) {
            withSession(state, action.payload, session => {
                session.step = action.payload.step;
            });
        },
    },
});

export const yieldActions = yieldSlice.actions;
export const yieldReducer = yieldSlice.reducer;

export const selectYield = (state: AppState) => state.wallet.yield;

export const selectYieldSession = (state: AppState, flowType: YieldFlowType, flowKey: string) =>
    selectYield(state)[flowType][flowKey] ?? initialYieldSessionState;
