import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type SPARK_NETWORK_SYMBOL } from '@suite-common/spark';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { changeNetworks } from '@suite-common/wallet-core';

import { type AppState } from 'src/types/suite';

export const ACCOUNT_SEARCH_PREFIX = '@suite/account-search';

export type AccountSearchCoinFilter = NetworkSymbol | typeof SPARK_NETWORK_SYMBOL;

export type AccountSearchState = {
    coinFilter: AccountSearchCoinFilter[];
    searchString: string | undefined;
};

export const accountSearchInitialState: AccountSearchState = {
    coinFilter: [],
    searchString: undefined,
};

const accountSearchSlice = createSlice({
    name: ACCOUNT_SEARCH_PREFIX,
    initialState: accountSearchInitialState,
    reducers: {
        setCoinFilter(state, action: PayloadAction<AccountSearchCoinFilter[]>) {
            state.coinFilter = action.payload ?? [];
        },
        toggleCoinFilter(state, action: PayloadAction<AccountSearchCoinFilter>) {
            const symbol = action.payload;
            if (!symbol) return;

            if (state.coinFilter.includes(symbol)) {
                state.coinFilter = state.coinFilter.filter(s => s !== symbol);
            } else {
                state.coinFilter.push(symbol);
            }
        },
        setSearchString(state, action: PayloadAction<string | undefined>) {
            state.searchString = action.payload;
        },
    },
    extraReducers: builder => {
        // reset coin filter on:
        // 1) disabling/enabling coins
        // 2) adding a new account is handled directly in add account modal, reacting on ACCOUNT.CREATE would cause resetting during initial accounts discovery
        builder.addCase(changeNetworks, state => {
            state.coinFilter = [];
            state.searchString = undefined;
        });
        // reset coin filter search
        builder.addCase(deviceActions.selectDevice, state => {
            state.searchString = undefined;
        });
    },
});

export const accountSearchActions = accountSearchSlice.actions;
export const accountSearchReducer = accountSearchSlice.reducer;

export const selectAccountSearch = (state: AppState) => state.wallet.accountSearch;

export default accountSearchReducer;
