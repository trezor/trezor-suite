import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

import {
    TRON_FLOWS,
    TRON_FLOW_STEPS,
    type TronFlow,
    type TronStakeError,
    type TronStakeStepId,
} from './tronStakeTypes';
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

export type TronStakeSessionsState = Record<AccountKey, Partial<Record<TronFlow, TronStakeState>>>;

export type TronStakeReducerState = {
    sessions: TronStakeSessionsState;
    txReview: TronStakeTxReviewState;
};

export type TronStakeRootState = {
    wallet: {
        tronStake: TronStakeReducerState;
    };
};

export const createTronStakeSession = (flow: TronFlow): TronStakeState => ({
    step: TRON_FLOW_STEPS[flow][0],
    isSubmitting: false,
    error: null,
    pendingTxid: null,
});

const initialTronStakeSessions = Object.fromEntries(
    TRON_FLOWS.map(flow => [flow, Object.freeze(createTronStakeSession(flow))]),
) as Record<TronFlow, TronStakeState>;

export const getInitialTronStakeSession = (flow: TronFlow): TronStakeState =>
    initialTronStakeSessions[flow];

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

const getNextStep = (flow: TronFlow, step: TronStakeStepId): TronStakeStepId => {
    const steps: readonly TronStakeStepId[] = TRON_FLOW_STEPS[flow];
    const index = steps.indexOf(step);

    return steps[index + 1] ?? step;
};

type SessionPayload = { accountKey: AccountKey; flow: TronFlow };

const getSession = (
    state: TronStakeReducerState,
    accountKey: AccountKey,
    flow: TronFlow,
): TronStakeState => state.sessions[accountKey]?.[flow] ?? createTronStakeSession(flow);

const setSession = (
    state: TronStakeReducerState,
    accountKey: AccountKey,
    flow: TronFlow,
    session: TronStakeState,
) => {
    state.sessions[accountKey] = { ...state.sessions[accountKey], [flow]: session };
};

export const tronStakeSlice = createSlice({
    name: TRON_STAKE_PREFIX,
    initialState,
    reducers: {
        goToStep(state, action: PayloadAction<SessionPayload & { step: TronStakeStepId }>) {
            const { accountKey, flow, step } = action.payload;
            setSession(state, accountKey, flow, { ...getSession(state, accountKey, flow), step });
        },
        pendingTransactionConfirmed(state, action: PayloadAction<SessionPayload>) {
            const { accountKey, flow } = action.payload;
            const session = getSession(state, accountKey, flow);
            setSession(state, accountKey, flow, {
                ...session,
                pendingTxid: null,
                step: getNextStep(flow, session.step),
            });
        },
        pendingTransactionFailed(state, action: PayloadAction<SessionPayload>) {
            const { accountKey, flow } = action.payload;
            setSession(state, accountKey, flow, {
                ...getSession(state, accountKey, flow),
                pendingTxid: null,
                error: { kind: 'confirmation-failed' },
            });
        },
        reset(state, action: PayloadAction<SessionPayload>) {
            const { accountKey, flow } = action.payload;
            setSession(state, accountKey, flow, createTronStakeSession(flow));
        },
        submitStarted(state, action: PayloadAction<SessionPayload>) {
            const { accountKey, flow } = action.payload;
            setSession(state, accountKey, flow, {
                ...getSession(state, accountKey, flow),
                isSubmitting: true,
                error: null,
            });
        },
        submitFinished(
            state,
            action: PayloadAction<SessionPayload & { txid?: string; error?: TronStakeError }>,
        ) {
            const { accountKey, flow, txid, error } = action.payload;
            setSession(state, accountKey, flow, {
                ...getSession(state, accountKey, flow),
                isSubmitting: false,
                pendingTxid: txid ?? null,
                error: error && error.kind !== 'cancelled' ? error : null,
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
