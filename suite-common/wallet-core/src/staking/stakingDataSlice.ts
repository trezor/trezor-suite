import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StakingBatch, type StakingBatchDataItem } from '@suite-common/earn-staking-api';
import { exhaustive } from '@trezor/type-utils';

import { type EthereumStatsByProvider } from './ethereum/ethereumStakingStats';
import { mapEverstakeBatchItem } from './ethereum/providers/everstake/everstakeStats';

export type StakeDataState = {
    error: null | string;
    isLoading: boolean;
    /**
     * When `data` was last verified fresh. It tracks `data`, so an in-flight or failed refetch
     * leaves it untouched — they keep showing the previously fetched `data`.
     */
    lastSuccessAt: null | number;

    data: {
        eth: EthereumStatsByProvider | undefined;
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

            state.data = action.payload.reduce<StakeDataState['data']>(
                (acc, item) => {
                    switch (item.symbol) {
                        case 'eth':
                            acc.eth = mapEverstakeBatchItem(item);
                            break;
                        case 'sol':
                            acc.sol = item;
                            break;
                        case 'ada':
                            acc.ada = item;
                            break;
                        case 'trx':
                            break;
                        default:
                            exhaustive(item);
                    }

                    return acc;
                },
                { eth: undefined, sol: undefined, ada: undefined },
            );
        },
        fetchStakeDataFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
    },
});

export const stakeDataActions = stakeDataSlice.actions;
export const stakeDataReducer = stakeDataSlice.reducer;
