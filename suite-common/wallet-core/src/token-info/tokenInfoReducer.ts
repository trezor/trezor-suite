import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';

import { fetchTokenInfoThunk } from './tokenInfoThunks';
import { type TokenInfoEntry, type TokenInfoState } from './tokenInfoTypes';

export const tokenInfoInitialState: TokenInfoState = {};

// A contract or network symbol is never one of these, but guard the computed-key
// writes against prototype pollution from untrusted input.
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];
const isUnsafeKey = (key: string) => UNSAFE_KEYS.includes(key);

const updateEntry = (
    state: TokenInfoState,
    symbol: NetworkSymbol,
    contract: TokenAddress,
    update: (prev: TokenInfoEntry | undefined) => TokenInfoEntry,
) => {
    const key = contract.toLowerCase() as TokenAddress;

    if (isUnsafeKey(symbol) || isUnsafeKey(key)) {
        return;
    }

    if (!state[symbol]) {
        state[symbol] = {};
    }
    const network = state[symbol];

    if (network) {
        network[key] = update(network[key]);
    }
};

export const prepareTokenInfoReducer = createReducerWithExtraDeps(
    tokenInfoInitialState,
    builder => {
        builder
            // Creating the entry marks the fetch in flight (entry present, no decimals, no error).
            .addCase(fetchTokenInfoThunk.pending, (state, action) => {
                const { symbol, contract } = action.meta.arg;
                updateEntry(state, symbol, contract, prev => ({ ...prev, error: false }));
            })
            .addCase(fetchTokenInfoThunk.fulfilled, (state, action) => {
                const { symbol, contract } = action.meta.arg;
                updateEntry(state, symbol, contract, () => ({ ...action.payload, error: false }));
            })
            .addCase(fetchTokenInfoThunk.rejected, (state, action) => {
                const { symbol, contract } = action.meta.arg;
                updateEntry(state, symbol, contract, prev => ({ ...prev, error: true }));
            });
    },
);
