import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';

type State = {
    search: string;
    networkSymbol: NetworkSymbol | undefined;
};

const initialState: State = {
    search: '',
    networkSymbol: undefined,
};

export const globalSendReceiveFilters = createSlice({
    name: 'globalSendReceiveFilters',
    initialState,
    reducers: {
        setSearch(state, action: PayloadAction<State['search']>) {
            state.search = action.payload;
        },
        setNetworkSymbol(state, action: PayloadAction<State['networkSymbol']>) {
            state.networkSymbol = action.payload;
        },
        resetFilters(state) {
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

export type GlobalSendReceiveAction = ReturnType<
    (typeof globalSendReceiveFilters.actions)[keyof typeof globalSendReceiveFilters.actions]
>;
