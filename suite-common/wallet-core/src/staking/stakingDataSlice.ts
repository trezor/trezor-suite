import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StakingBatch, type StakingBatchDataItem } from '@suite-common/earn-staking-api';

export type StakeDataState = {
    error: null | string;
    isLoading: boolean;
    /**
     * When `data` was last verified fresh. It tracks `data`, so an in-flight or failed refetch
     * leaves it untouched — they keep showing the previously fetched `data`.
     */
    lastSuccessAt: null | number;

    data: {
        eth: Omit<Extract<StakingBatchDataItem, { symbol: 'eth' }>, 'symbol'> | undefined;
        sol: Omit<Extract<StakingBatchDataItem, { symbol: 'sol' }>, 'symbol'> | undefined;
        ada: Omit<Extract<StakingBatchDataItem, { symbol: 'ada' }>, 'symbol'> | undefined;
    };
};

export const stakeDataInitialState: StakeDataState = {
    error: null,
    isLoading: false,
    lastSuccessAt: null,
    data: {
        ada: undefined,
        eth: undefined,
        sol: undefined,
    },
} as const satisfies StakeDataState;

const stakeDataSlice = createSlice({
    name: 'stakeData',
    initialState: stakeDataInitialState,
    reducers: {
        fetchStakeDataRequest: state => {
            state.error = null;
            state.isLoading = true;
        },
        fetchStakeDataSuccess: (state, action: PayloadAction<StakingBatch['data']>) => {
            state.error = null;
            state.isLoading = false;
            state.lastSuccessAt = Date.now();

            const data = action.payload.reduce<StakeDataState['data']>(
                (acc, item) => {
                    // @ts-expect-error
                    acc[item.symbol] = item;

                    return acc;
                },
                {} as StakeDataState['data'],
            );

            state.data = data;
        },
        fetchStakeDataFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        fetchStakeDataReset: state => {
            state.error = null;
            state.isLoading = false;
            state.lastSuccessAt = null;
            state.data = stakeDataInitialState.data;
        },
    },
});

export const stakeDataActions = stakeDataSlice.actions;
export const stakeDataReducer = stakeDataSlice.reducer;
