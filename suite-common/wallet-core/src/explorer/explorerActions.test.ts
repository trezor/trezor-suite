import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { explorerActions } from './explorerActions';
import {
    type ExplorerConfig,
    explorerInitialState,
    getExplorer,
    prepareExplorerReducer,
} from './explorerReducer';

const explorerReducer = prepareExplorerReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadExplorer: mockReducer() },
});
const btcSymbol = asNetworkSymbol('btc');

const initStore = (state: Partial<ExplorerConfig> = {}) =>
    createTestStore({
        extra: undefined,
        reducer: {
            wallet: combineReducers({
                explorer: explorerReducer,
            }),
        },
        preloadedState: {
            wallet: {
                explorer: { ...explorerInitialState, ...state },
            },
        },
    });

test('getExplorer throws when state is missing', () => {
    expect(() => getExplorer({}, btcSymbol)).toThrow('Explorer state not found: btc');
});

describe('setExplorer', () => {
    test.each([
        { base: 'http://mempool.space', tx: 'tx', address: 'address' },
        { base: 'https://mempool.space', tx: 'transaction', address: 'address' },
        { base: 'https://mempool.space', tx: 'tx', address: 'addr' },
    ])('stores custom explorer', explorer => {
        const store = initStore();

        store.dispatch(
            explorerActions.setExplorer({
                symbol: btcSymbol,
                explorer,
            }),
        );

        expect(getExplorer(store.getState().wallet.explorer, btcSymbol).custom).toEqual(explorer);
    });

    test('removes stored custom explorer', () => {
        const store = initStore({
            [btcSymbol]: {
                default: { base: 'https://mempool.space', tx: 'tx', address: 'address' },
                custom: { base: 'https://mempool.space', tx: 'tx', address: 'address' },
            },
        });

        store.dispatch(explorerActions.setExplorer({ symbol: btcSymbol }));

        expect(getExplorer(store.getState().wallet.explorer, btcSymbol).custom).toEqual(undefined);
    });

    test.each([
        { base: 'https://mempool.space', tx: 'tx', address: 'address' },
        { base: 'https://mempool.space/', tx: 'tx', address: 'address' },
        { base: 'https://mempool.space', tx: ' tx/', address: 'address' },
        { base: 'https://mempool.space', tx: 'tx', address: '/address ' },
    ])('uses default explorer', explorer => {
        const store = initStore();

        store.dispatch(
            explorerActions.setExplorer({
                symbol: btcSymbol,
                explorer,
            }),
        );

        expect(getExplorer(store.getState().wallet.explorer, btcSymbol).custom).toEqual(undefined);
    });
});
