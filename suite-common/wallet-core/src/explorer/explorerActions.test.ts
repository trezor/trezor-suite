import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { explorerActions } from './explorerActions';
import {
    type ExplorerConfig,
    explorerInitialState,
    prepareExplorerReducer,
} from './explorerReducer';

const explorerReducer = prepareExplorerReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadExplorer: mockReducer() },
});
const btcSymbol = asNetworkSymbol('btc');

const initStore = (state: Partial<ExplorerConfig> = {}) =>
    configureMockStore({
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

        expect(store.getState().wallet.explorer.btc.custom).toEqual(explorer);
    });

    test('removes stored custom explorer', () => {
        const store = initStore({
            [btcSymbol]: {
                default: { base: 'https://mempool.space', tx: 'tx', address: 'address' },
                custom: { base: 'https://mempool.space', tx: 'tx', address: 'address' },
            },
        });

        store.dispatch(explorerActions.setExplorer({ symbol: btcSymbol }));

        expect(store.getState().wallet.explorer.btc.custom).toEqual(undefined);
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

        expect(store.getState().wallet.explorer.btc.custom).toEqual(undefined);
    });
});
