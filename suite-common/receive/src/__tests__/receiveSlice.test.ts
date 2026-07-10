import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { accountsActions } from '@suite-common/wallet-core';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import {
    prepareReceiveReducer,
    receiveActions,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from '../receiveSlice';

const bitcoinAccount = mockWalletAccount({ symbol: 'btc' });
const ethereumAccount = mockWalletAccount({ symbol: 'eth' }, networkSpecificDefaultEthereum);
const receiveReducer = prepareReceiveReducer(extraDependenciesCommonMock);

describe('receiveSlice', () => {
    it('loads persisted accounts and strips legacy verification flag on @storage/load', () => {
        const state = receiveReducer(undefined, {
            type: extraDependenciesCommonMock.actionTypes.storageLoad,
            payload: {
                receive: [
                    {
                        key: bitcoinAccount.key,
                        value: {
                            revealedAddresses: [
                                {
                                    path: 'btc-path',
                                    address: 'btc-address',
                                    isVerified: true,
                                },
                            ],
                            currentFreshAddress: {
                                path: 'fresh-btc',
                                address: 'btc-fresh-address',
                            },
                        },
                    },
                ],
            },
        });

        expect(state.accounts).toEqual({
            [bitcoinAccount.key]: {
                touchedAddresses: [
                    {
                        path: 'btc-path',
                        address: 'btc-address',
                    },
                ],
                currentFreshAddress: {
                    path: 'fresh-btc',
                    address: 'btc-fresh-address',
                },
            },
        });
    });

    it('loads persisted accounts with touched addresses on @storage/load', () => {
        const state = receiveReducer(undefined, {
            type: extraDependenciesCommonMock.actionTypes.storageLoad,
            payload: {
                receive: [
                    {
                        key: bitcoinAccount.key,
                        value: {
                            touchedAddresses: [
                                {
                                    path: 'btc-path',
                                    address: 'btc-address',
                                },
                            ],
                        },
                    },
                ],
            },
        });

        expect(state.accounts).toEqual({
            [bitcoinAccount.key]: {
                touchedAddresses: [
                    {
                        path: 'btc-path',
                        address: 'btc-address',
                    },
                ],
                currentFreshAddress: undefined,
            },
        });
    });

    it('stores fresh and touched addresses per account', () => {
        let state = receiveReducer(undefined, { type: 'test-init' });

        state = receiveReducer(
            state,
            receiveActions.setCurrentFreshAddress({
                accountKey: bitcoinAccount.key,
                currentFreshAddress: {
                    path: 'fresh-btc',
                    address: 'btc-fresh-address',
                },
            }),
        );
        state = receiveReducer(
            state,
            receiveActions.setCurrentFreshAddress({
                accountKey: ethereumAccount.key,
                currentFreshAddress: {
                    path: 'fresh-eth',
                    address: 'eth-fresh-address',
                },
            }),
        );
        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'used-btc', 'btc-used-address'),
        );

        expect(state.accounts[bitcoinAccount.key]).toEqual({
            touchedAddresses: [
                {
                    path: 'used-btc',
                    address: 'btc-used-address',
                },
            ],
            currentFreshAddress: undefined,
        });
        expect(state.accounts[ethereumAccount.key]).toEqual({
            touchedAddresses: [],
            currentFreshAddress: {
                path: 'fresh-eth',
                address: 'eth-fresh-address',
            },
        });
    });

    it('keeps an existing touched address only once', () => {
        let state = receiveReducer(undefined, { type: 'test-init' });

        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'path-1', 'address-1'),
        );

        expect(state.accounts[bitcoinAccount.key]?.touchedAddresses).toEqual([
            {
                path: 'path-1',
                address: 'address-1',
            },
        ]);

        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'path-1', 'address-1'),
        );

        expect(state.accounts[bitcoinAccount.key]?.touchedAddresses).toEqual([
            {
                path: 'path-1',
                address: 'address-1',
            },
        ]);
    });

    it('clears removed account state on accountsActions.removeAccount', () => {
        let state = receiveReducer(undefined, { type: 'test-init' });

        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'btc-path', 'btc-address'),
        );
        state = receiveReducer(
            state,
            receiveActions.showAddress(ethereumAccount.key, 'eth-path', 'eth-address'),
        );

        expect(state.accounts[bitcoinAccount.key]).toEqual({
            touchedAddresses: [
                {
                    path: 'btc-path',
                    address: 'btc-address',
                },
            ],
            currentFreshAddress: undefined,
        });
        expect(state.accounts[ethereumAccount.key]).toEqual({
            touchedAddresses: [
                {
                    path: 'eth-path',
                    address: 'eth-address',
                },
            ],
            currentFreshAddress: undefined,
        });

        state = receiveReducer(state, accountsActions.removeAccount([bitcoinAccount]));

        expect(state.accounts[bitcoinAccount.key]).toBeUndefined();
        expect(state.accounts[ethereumAccount.key]).toEqual({
            touchedAddresses: [
                {
                    path: 'eth-path',
                    address: 'eth-address',
                },
            ],
            currentFreshAddress: undefined,
        });
    });

    it('selects state for the requested account key and falls back to empty', () => {
        let state = receiveReducer(undefined, { type: 'test-init' });

        state = receiveReducer(
            state,
            receiveActions.setCurrentFreshAddress({
                accountKey: bitcoinAccount.key,
                currentFreshAddress: {
                    path: 'fresh-btc',
                    address: 'btc-fresh-address',
                },
            }),
        );
        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'btc-path', 'btc-address'),
        );

        const loadedState = {
            receive: state,
        };

        expect(selectTouchedAddresses(loadedState, bitcoinAccount.key)).toEqual([
            {
                path: 'btc-path',
                address: 'btc-address',
            },
        ]);
        expect(selectCurrentFreshAddress(loadedState, bitcoinAccount.key)).toBeUndefined();
        expect(selectTouchedAddresses(loadedState)).toEqual([]);
        expect(selectCurrentFreshAddress(loadedState)).toBeUndefined();
    });
});
