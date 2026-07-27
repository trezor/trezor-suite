import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';

export type GlobalSendReceiveFiltersState = {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
};

const initialState: GlobalSendReceiveFiltersState = {
    search: '',
    networkSymbol: undefined,
};

const globalSendReceiveFiltersSlice = createSlice({
    name: 'globalSendReceiveFilters',
    initialState,
    reducers: {
        setSearch(
            state: GlobalSendReceiveFiltersState,
            action: PayloadAction<GlobalSendReceiveFiltersState['search']>,
        ) {
            state.search = action.payload;
        },
        setNetworkSymbol(
            state: GlobalSendReceiveFiltersState,
            action: PayloadAction<GlobalSendReceiveFiltersState['networkSymbol']>,
        ) {
            state.networkSymbol = action.payload;
        },
        resetFilters(state: GlobalSendReceiveFiltersState) {
            state.search = '';
            state.networkSymbol = undefined;
        },
    },
    selectors: {
        selectSearch: state => state.search,
        filledSearch: state => state.search !== '',
        selectNetworkSymbol: state => state.networkSymbol,
        selectFilters: state => ({
            search: state.search,
            networkSymbol: state.networkSymbol,
        }),
    },
});

export const globalSendReceiveFiltersActions = globalSendReceiveFiltersSlice.actions;
export const globalSendReceiveFiltersReducer = globalSendReceiveFiltersSlice.reducer;
export const globalSendReceiveFiltersSelectors = globalSendReceiveFiltersSlice.selectors;

export type GlobalSendReceiveAction = ReturnType<
    (typeof globalSendReceiveFiltersActions)[keyof typeof globalSendReceiveFiltersActions]
>;
