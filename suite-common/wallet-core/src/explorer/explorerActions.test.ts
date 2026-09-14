import { combineReducers } from '@reduxjs/toolkit';
import { networksActions } from '@suite-common/networks';
import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { explorerActions } from './explorerActions';
import {
    type ExplorerConfig,
    createExplorerInitialState,
    prepareExplorerReducer,
} from './explorerReducer';

const networkConfigDeps = mockNetworkConfigDeps();

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
                explorer: {
                    ...createExplorerInitialState(networkConfigDeps.getNetworkConfigs()),
                    ...state,
                },
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

it('loads module explorer defaults while preserving custom explorers', () => {
    const bitcoin = networkConfigDeps.getNetworkConfig('btc');
    const loaded = explorerReducer(undefined, networksActions.setNetworks([bitcoin]));
    expect(Object.keys(loaded)).toEqual(['btc']);

    const custom = { base: 'https://custom.example', tx: 'tx', address: 'address' };
    const configured = explorerReducer(
        loaded,
        explorerActions.setExplorer({ symbol: 'btc', explorer: custom }),
    );
    const reloaded = explorerReducer(configured, networksActions.setNetworks([bitcoin]));
    expect(reloaded.btc.custom).toEqual(custom);
    expect(reloaded.btc.default).toEqual(loaded.btc.default);
});
