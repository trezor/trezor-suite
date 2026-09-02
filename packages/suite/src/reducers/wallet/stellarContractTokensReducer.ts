import { createSlice } from '@reduxjs/toolkit';

import {
    STELLAR_CONTRACT_TOKENS as COMMON_STELLAR_CONTRACT_TOKENS,
    type StellarContractTokensAction,
    stellarContractTokensReducer as commonStellarContractTokensReducer,
    stellarContractTokensInitialState,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { STORAGE } from 'src/actions/suite/constants';

import type { StorageAction } from '../../actions/suite/storageActions';

export const STELLAR_CONTRACT_TOKENS = 'stellarContractTokens';

const stellarContractTokensSlice = createSlice({
    name: STELLAR_CONTRACT_TOKENS,
    initialState: stellarContractTokensInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(STORAGE.LOAD, (state, action) => {
                const { payload } = action as StorageAction;

                if (payload == 'blocked' || payload == 'blocking') {
                    return;
                }

                payload.stellarContractTokens.forEach(
                    ({ key, value }: { key: string; value: string[] }) => {
                        state[key as AccountKey] = value;
                    },
                );
            })
            .addMatcher(
                action => action.type.startsWith(COMMON_STELLAR_CONTRACT_TOKENS),
                (state, action: StellarContractTokensAction) => {
                    commonStellarContractTokensReducer(state, action);
                },
            );
    },
});

const stellarContractTokensReducer = stellarContractTokensSlice.reducer;

export default stellarContractTokensReducer;
