import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type TransactionDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import { isSafeObjectKey } from '@trezor/utils';

import type {
    YieldApproveModalState,
    YieldFlowStepId,
    YieldFlowType,
    YieldPendingTransactionState,
} from './stablecoinYieldTypes';
import { transactionsActions } from '../transactions/transactionsActions';

type StablecoinYieldTranslationKey = string;

type StablecoinYieldSerializedTx = {
    tx: string;
    symbol: NetworkSymbol;
};

type StablecoinYieldActionReviewState = {
    amount: string;
    receiptAmount: string;
    unsignedTransaction: string;
};

export type YieldAllowanceStatus = 'idle' | 'loading' | 'loaded' | 'error';

export const STABLECOIN_YIELD_PREFIX = '@suite-common/wallet-core/stablecoin-yield';

export type StablecoinYieldTxReviewState = {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    vaultName?: string;
    availableRewards?: YieldClaimReward[];
    serializedTx?: StablecoinYieldSerializedTx;
    accountKey?: AccountKey;
};

export type StablecoinYieldSessionState = {
    step: YieldFlowStepId;
    error: StablecoinYieldTranslationKey | null;
    approval: {
        allowanceAmount: string | null;
        modalState: YieldApproveModalState | null;
        isSubmitting: boolean;
        isPending: boolean;
        allowanceStatus: YieldAllowanceStatus;
        isInitializingAllowance: boolean;
        isModifyMode: boolean;
        isRevokeRequired: boolean;
        revokeTransactions: TransactionDto[] | null;
        approvedSpender: string | null;
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
        isPending: false,
        allowanceStatus: 'idle',
        isInitializingAllowance: false,
        isModifyMode: false,
        isRevokeRequired: false,
        revokeTransactions: null,
        approvedSpender: null,
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
    },
};

export const initialStablecoinYieldTxReviewState: StablecoinYieldTxReviewState = {
    precomposedTx: undefined,
    precomposedForm: undefined,
    vaultName: undefined,
    availableRewards: undefined,
    serializedTx: undefined,
    accountKey: undefined,
};

export const initialStablecoinYieldState: StablecoinYieldState = {
    deposit: Object.create(null),
    withdraw: Object.create(null),
    claim: Object.create(null),
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
        startSubmittingApproval(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isSubmitting = true;
                session.approval.modalState = null;
                session.approval.revokeTransactions = null;
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
                session.approval.isInitializingAllowance = true;
            });
        },
        finishInitializingAllowance(
            state,
            action: PayloadAction<StablecoinYieldSessionActionPayload>,
        ) {
            withSession(state, action.payload, session => {
                session.approval.isInitializingAllowance = false;
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
                session.approval.isInitializingAllowance = false;
            });
        },
        enterModifyMode(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = true;
                session.approval.modalState = null;
                session.action.pendingTransaction = null;
                session.action.review = null;
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
                session.approval.modalState = null;
                session.approval.isRevokeRequired = false;
                session.action.amount = action.payload.amount;
                session.approval.isPending = false;
                session.action.pendingTransaction = null;
                session.action.review = null;
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
                session.approval.isRevokeRequired = false;
                session.approval.revokeTransactions = null;
                session.step = 'approve';
            });
        },
        revokeSuccess(state, action: PayloadAction<StablecoinYieldSessionActionPayload>) {
            withSession(state, action.payload, session => {
                session.approval.isModifyMode = false;
                session.approval.allowanceAmount = '0';
                session.approval.allowanceStatus = 'loaded';
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
            action: PayloadAction<
                StablecoinYieldSessionActionPayload & StablecoinYieldActionReviewState
            >,
        ) {
            withSession(state, action.payload, session => {
                session.action.amount = action.payload.amount;
                session.action.review = {
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
                session.action.review = null;
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
                vaultName?: string;
                availableRewards?: YieldClaimReward[];
                accountKey: AccountKey;
            }>,
        ) {
            state.txReview.precomposedTx = action.payload.precomposedTx;
            state.txReview.precomposedForm = action.payload.precomposedForm;
            state.txReview.vaultName = action.payload.vaultName;
            state.txReview.availableRewards = action.payload.availableRewards;
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
            state.txReview.vaultName = undefined;
            state.txReview.availableRewards = undefined;
            state.txReview.serializedTx = undefined;
            state.txReview.accountKey = undefined;
        },
    },
    extraReducers: builder => {
        builder.addCase(transactionsActions.replaceTransaction, (state, { payload }) => {
            const { txid: prevTxid, tx } = payload;
            (['deposit', 'withdraw', 'claim'] as const).forEach(flowType => {
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
