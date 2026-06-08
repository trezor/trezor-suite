import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { submitTronFreezeThunk } from './tronStakeThunks';
import { TRON_STAKE_FLOW_STEPS, type TronStakeError, type TronStakeStepId } from './tronStakeTypes';

export const TRON_STAKE_PREFIX = '@suite-common/wallet-core/tron-stake';

export type TronStakeState = {
    step: TronStakeStepId;
    isSubmitting: boolean;
    error: TronStakeError | null;
    pendingTxid: string | null;
};

export type TronStakeRootState = {
    wallet: {
        tronStake: TronStakeState;
    };
};

export const initialTronStakeState: TronStakeState = {
    step: 'freeze',
    isSubmitting: false,
    error: null,
    pendingTxid: null,
};

const getNextStep = (step: TronStakeStepId): TronStakeStepId => {
    const index = TRON_STAKE_FLOW_STEPS.indexOf(step);

    return TRON_STAKE_FLOW_STEPS[index + 1] ?? step;
};

export const tronStakeSlice = createSlice({
    name: TRON_STAKE_PREFIX,
    initialState: initialTronStakeState,
    reducers: {
        goToStep(state, action: PayloadAction<{ step: TronStakeStepId }>) {
            state.step = action.payload.step;
        },
        pendingTransactionConfirmed(state) {
            state.pendingTxid = null;
            state.step = getNextStep(state.step);
        },
        pendingTransactionFailed(state) {
            state.pendingTxid = null;
            state.error = { kind: 'confirmation-failed' };
        },
        reset() {
            return initialTronStakeState;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(submitTronFreezeThunk.pending, state => {
                state.isSubmitting = true;
                state.error = null;
            })
            .addCase(submitTronFreezeThunk.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.pendingTxid = action.payload.txid;
            })
            .addCase(submitTronFreezeThunk.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error =
                    action.payload?.kind === 'cancelled'
                        ? null
                        : (action.payload ?? { kind: 'sign-failed' });
            });
    },
});

export const tronStakeActions = tronStakeSlice.actions;
export const tronStakeReducer = tronStakeSlice.reducer;
