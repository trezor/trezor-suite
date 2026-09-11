import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { typedObjectFromEntries } from '@trezor/utils';

import type { NetworkMetadata } from './NetworkMetadata';
import type { NetworkSymbol } from '../src/NetworkModules';

export type NetworksState = Record<NetworkSymbol, NetworkMetadata> | null;

export type NetworksRootState = {
    networks: NetworksState;
};

const networksSlice = createSlice({
    name: '@suite-common/networks',
    initialState: (): NetworksState => null,
    reducers: {
        setNetworks: (_state: NetworksState, action: PayloadAction<readonly NetworkMetadata[]>) =>
            typedObjectFromEntries(
                action.payload.map(network => [network.symbol, network] as const),
            ),
    },
});

export const networksReducer = networksSlice.reducer;
export const networksActions = networksSlice.actions;
