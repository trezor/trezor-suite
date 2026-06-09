import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import { TRON_STAKE_FLOW_STEPS, type TronStakeError, type TronStakeStepId } from './tronStakeTypes';
import { type SerializedTx } from '../../send/sendFormTypes';

export const TRON_STAKE_PREFIX = '@suite-common/wallet-core/tron-stake';

export type TronStakeState = {
    step: TronStakeStepId;
    isSubmitting: boolean;
    error: TronStakeError | null;
    pendingTxid: string | null;
};

export type TronStakeTxReviewState = {
    precomposedTx?: PrecomposedTransactionFinal;
    precomposedForm?: FormState;
    serializedTx?: SerializedTx;
    accountKey?: AccountKey;
};

export type TronStakeSessionsState = Record<AccountKey, TronStakeState>;

export type TronStakeReducerState = {
    sessions: TronStakeSessionsState;
    txReview: TronStakeTxReviewState;
};

export type TronStakeRootState = {
    wallet: {
        tronStake: TronStakeReducerState;
    };
};

export const initialTronStakeSession: TronStakeState = {
    step: 'freeze',
    isSubmitting: false,
    error: null,
    pendingTxid: null,
};

export const initialTronStakeTxReview: TronStakeTxReviewState = {
    precomposedTx: undefined,
    precomposedForm: undefined,
    serializedTx: undefined,
    accountKey: undefined,
};

const initialState: TronStakeReducerState = {
    sessions: {},
    txReview: initialTronStakeTxReview,
};

const getNextStep = (step: TronStakeStepId): TronStakeStepId => {
    const index = TRON_STAKE_FLOW_STEPS.indexOf(step);

    return TRON_STAKE_FLOW_STEPS[index + 1] ?? step;
};

export const tronStakeSlice = createSlice({
    name: TRON_STAKE_PREFIX,
    initialState,
    reducers: {
        goToStep(state, action: PayloadAction<{ accountKey: AccountKey; step: TronStakeStepId }>) {
            const { accountKey, step } = action.payload;
            state.sessions[accountKey] = {
                ...(state.sessions[accountKey] ?? initialTronStakeSession),
                step,
            };
        },
        pendingTransactionConfirmed(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            const session = state.sessions[action.payload.accountKey] ?? initialTronStakeSession;
            state.sessions[action.payload.accountKey] = {
                ...session,
                pendingTxid: null,
                step: getNextStep(session.step),
            };
        },
        pendingTransactionFailed(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            state.sessions[action.payload.accountKey] = {
                ...(state.sessions[action.payload.accountKey] ?? initialTronStakeSession),
                pendingTxid: null,
                error: { kind: 'confirmation-failed' },
            };
        },
        reset(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            state.sessions[action.payload.accountKey] = { ...initialTronStakeSession };
        },
        submitStarted(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            state.sessions[action.payload.accountKey] = {
                ...(state.sessions[action.payload.accountKey] ?? initialTronStakeSession),
                isSubmitting: true,
                error: null,
            };
        },
        submitFinished(
            state,
            action: PayloadAction<{
                accountKey: AccountKey;
                txid?: string;
                error?: TronStakeError;
            }>,
        ) {
            const { accountKey, txid, error } = action.payload;
            state.sessions[accountKey] = {
                ...(state.sessions[accountKey] ?? initialTronStakeSession),
                isSubmitting: false,
                pendingTxid: txid ?? null,
                error: error && error.kind !== 'cancelled' ? error : null,
            };
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
        storeSignedTransaction(state, action: PayloadAction<{ serializedTx: SerializedTx }>) {
            state.txReview.serializedTx = action.payload.serializedTx;
        },
        discardTransaction(state) {
            state.txReview = { ...initialTronStakeTxReview };
        },
    },
});

export const tronStakeActions = tronStakeSlice.actions;
export const tronStakeReducer = tronStakeSlice.reducer;
