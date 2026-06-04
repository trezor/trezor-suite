import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type TronStakeStepId } from './tronStakeTypes';

export const TRON_STAKE_PREFIX = '@suite-common/wallet-core/tron-stake';

export type TronStakeState = {
    step: TronStakeStepId;
};

export type TronStakeRootState = {
    wallet: {
        tronStake: TronStakeState;
    };
};

export const initialTronStakeState: TronStakeState = {
    step: 'freeze',
};

export const tronStakeSlice = createSlice({
    name: TRON_STAKE_PREFIX,
    initialState: initialTronStakeState,
    reducers: {
        goToStep(state, action: PayloadAction<{ step: TronStakeStepId }>) {
            state.step = action.payload.step;
        },
        reset(state) {
            state.step = initialTronStakeState.step;
        },
    },
});

export const tronStakeActions = tronStakeSlice.actions;
export const tronStakeReducer = tronStakeSlice.reducer;
