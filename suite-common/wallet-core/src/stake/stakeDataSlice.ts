import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StakingBatch, type StakingBatchDataItem } from '@suite-common/earn-staking-api';

export type StakeDataState = {
    error: null | string;
    isLoading: boolean;
    lastSuccessAt: null | number;

    data: {
        eth: Omit<Extract<StakingBatchDataItem, { symbol: 'eth' }>, 'symbol'> | undefined;
        sol: Omit<Extract<StakingBatchDataItem, { symbol: 'sol' }>, 'symbol'> | undefined;
        ada: Omit<Extract<StakingBatchDataItem, { symbol: 'ada' }>, 'symbol'> | undefined;
    };
};

const initialState: StakeDataState = {
    error: null,
    isLoading: false,
    lastSuccessAt: null,
    data: {
        ada: undefined,
        eth: undefined,
        sol: undefined,
    },
} as const satisfies StakeDataState;

export const stakeDataSlice = createSlice({
    name: 'stakeData',
    initialState,
    reducers: {
        fetchStakeDataRequest: state => {
            state.error = null;
            state.isLoading = true;
            state.lastSuccessAt = null;
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
            state.lastSuccessAt = null;
        },
        fetchStakeDataReset: state => {
            state.error = null;
            state.isLoading = false;
            state.lastSuccessAt = null;
            state.data = initialState.data;
        },
    },
});
