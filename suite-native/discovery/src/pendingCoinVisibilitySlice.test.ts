import { configureStore } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';

import {
    addPendingCoinVisibility,
    clearPendingCoinVisibility,
    pendingCoinVisibilitySlice,
    selectPendingCoinVisibilitySymbols,
} from './pendingCoinVisibilitySlice';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const ltcSymbol = asNetworkSymbol('ltc');

describe('pendingCoinVisibilitySlice', () => {
    const createStore = () =>
        configureStore({
            reducer: {
                pendingCoinVisibility: pendingCoinVisibilitySlice.reducer,
            },
        });

    it('should add symbol to pending when not already present', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility(btcSymbol));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc']);
    });

    it('should not add duplicate symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility(btcSymbol));
        store.dispatch(addPendingCoinVisibility(btcSymbol));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc']);
    });

    it('should add multiple different symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility(btcSymbol));
        store.dispatch(addPendingCoinVisibility(ethSymbol));
        store.dispatch(addPendingCoinVisibility(ltcSymbol));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc', 'eth', 'ltc']);
    });

    it('should clear all pending symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility(btcSymbol));
        store.dispatch(addPendingCoinVisibility(ethSymbol));
        store.dispatch(clearPendingCoinVisibility());

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual([]);
    });

    it('should have empty symbols initially', () => {
        const store = createStore();

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual([]);
    });
});
