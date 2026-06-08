import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';

import { submitTronFreezeThunk } from './tronStakeThunks';
import { TRON_STAKE_FLOW_STEPS, type TronStakeError, type TronStakeStepId } from './tronStakeTypes';

export const TRON_STAKE_PREFIX = '@suite-common/wallet-core/tron-stake';

export type TronStakeState = {
    step: TronStakeStepId;
    isSubmitting: boolean;
    error: TronStakeError | null;
    pendingTxid: string | null;
};

export type TronStakeSessionsState = Record<AccountKey, TronStakeState>;

export type TronStakeRootState = {
    wallet: {
        tronStake: TronStakeSessionsState;
    };
};

export const initialTronStakeSession: TronStakeState = {
    step: 'freeze',
    isSubmitting: false,
    error: null,
    pendingTxid: null,
};

const initialState: TronStakeSessionsState = {};

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
            state[accountKey] = { ...(state[accountKey] ?? initialTronStakeSession), step };
        },
        pendingTransactionConfirmed(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            const session = state[action.payload.accountKey] ?? initialTronStakeSession;
            state[action.payload.accountKey] = {
                ...session,
                pendingTxid: null,
                step: getNextStep(session.step),
            };
        },
        pendingTransactionFailed(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            state[action.payload.accountKey] = {
                ...(state[action.payload.accountKey] ?? initialTronStakeSession),
                pendingTxid: null,
                error: { kind: 'confirmation-failed' },
            };
        },
        reset(state, action: PayloadAction<{ accountKey: AccountKey }>) {
            state[action.payload.accountKey] = { ...initialTronStakeSession };
        },
    },
    extraReducers: builder => {
        builder
            .addCase(submitTronFreezeThunk.pending, (state, action) => {
                const { key } = action.meta.arg.account;
                state[key] = {
                    ...(state[key] ?? initialTronStakeSession),
                    isSubmitting: true,
                    error: null,
                };
            })
            .addCase(submitTronFreezeThunk.fulfilled, (state, action) => {
                const { key } = action.meta.arg.account;
                state[key] = {
                    ...(state[key] ?? initialTronStakeSession),
                    isSubmitting: false,
                    pendingTxid: action.payload.txid,
                };
            })
            .addCase(submitTronFreezeThunk.rejected, (state, action) => {
                const { key } = action.meta.arg.account;
                state[key] = {
                    ...(state[key] ?? initialTronStakeSession),
                    isSubmitting: false,
                    error:
                        action.payload?.kind === 'cancelled'
                            ? null
                            : (action.payload ?? { kind: 'sign-failed' }),
                };
            });
    },
});

export const tronStakeActions = tronStakeSlice.actions;
export const tronStakeReducer = tronStakeSlice.reducer;
