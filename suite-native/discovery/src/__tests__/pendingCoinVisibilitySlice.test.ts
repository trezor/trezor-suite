import { configureStore } from '@reduxjs/toolkit';

import {
    addPendingCoinVisibility,
    clearPendingCoinVisibility,
    pendingCoinVisibilitySlice,
    selectPendingCoinVisibilitySymbols,
} from '../pendingCoinVisibilitySlice';

describe('pendingCoinVisibilitySlice', () => {
    const createStore = () =>
        configureStore({
            reducer: {
                pendingCoinVisibility: pendingCoinVisibilitySlice.reducer,
            },
        });

    it('should add symbol to pending when not already present', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility('btc'));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc']);
    });

    it('should not add duplicate symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility('btc'));
        store.dispatch(addPendingCoinVisibility('btc'));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc']);
    });

    it('should add multiple different symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility('btc'));
        store.dispatch(addPendingCoinVisibility('eth'));
        store.dispatch(addPendingCoinVisibility('ltc'));

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual(['btc', 'eth', 'ltc']);
    });

    it('should clear all pending symbols', () => {
        const store = createStore();

        store.dispatch(addPendingCoinVisibility('btc'));
        store.dispatch(addPendingCoinVisibility('eth'));
        store.dispatch(clearPendingCoinVisibility());

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual([]);
    });

    it('should have empty symbols initially', () => {
        const store = createStore();

        expect(selectPendingCoinVisibilitySymbols(store.getState())).toEqual([]);
    });
});
