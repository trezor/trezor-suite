import { accountsActions } from '@suite-common/wallet-core';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import {
    receiveActions,
    receiveReducer,
    selectCurrentFreshAddress,
    selectReceiveRevealedAddresses,
} from '../receiveReducer';

const bitcoinAccount = mockWalletAccount({ symbol: 'btc' });
const ethereumAccount = mockWalletAccount({ symbol: 'eth' }, networkSpecificDefaultEthereum);

describe('receiveSlice', () => {
    it('loads persisted accounts on @storage/load', () => {
        const state = receiveReducer(undefined, {
            type: '@storage/load',
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
        });
    });

    it('stores fresh and revealed addresses per account', () => {
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
            receiveActions.showUnverifiedAddress(
                bitcoinAccount.key,
                'used-btc',
                'btc-used-address',
            ),
        );

        expect(state.accounts[bitcoinAccount.key]).toEqual({
            revealedAddresses: [
                {
                    path: 'used-btc',
                    address: 'btc-used-address',
                    isVerified: false,
                },
            ],
            currentFreshAddress: undefined,
        });
        expect(state.accounts[ethereumAccount.key]).toEqual({
            revealedAddresses: [],
            currentFreshAddress: {
                path: 'fresh-eth',
                address: 'eth-fresh-address',
            },
        });
    });

    it('marks an existing revealed address as verified', () => {
        let state = receiveReducer(undefined, { type: 'test-init' });

        state = receiveReducer(
            state,
            receiveActions.showUnverifiedAddress(bitcoinAccount.key, 'path-1', 'address-1'),
        );

        expect(state.accounts[bitcoinAccount.key]?.revealedAddresses).toEqual([
            {
                path: 'path-1',
                address: 'address-1',
                isVerified: false,
            },
        ]);

        state = receiveReducer(
            state,
            receiveActions.showAddress(bitcoinAccount.key, 'path-1', 'address-1'),
        );

        expect(state.accounts[bitcoinAccount.key]?.revealedAddresses).toEqual([
            {
                path: 'path-1',
                address: 'address-1',
                isVerified: true,
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
            revealedAddresses: [
                {
                    path: 'btc-path',
                    address: 'btc-address',
                    isVerified: true,
                },
            ],
            currentFreshAddress: undefined,
        });
        expect(state.accounts[ethereumAccount.key]).toEqual({
            revealedAddresses: [
                {
                    path: 'eth-path',
                    address: 'eth-address',
                    isVerified: true,
                },
            ],
            currentFreshAddress: undefined,
        });

        state = receiveReducer(state, accountsActions.removeAccount([bitcoinAccount]));

        expect(state.accounts[bitcoinAccount.key]).toBeUndefined();
        expect(state.accounts[ethereumAccount.key]).toEqual({
            revealedAddresses: [
                {
                    path: 'eth-path',
                    address: 'eth-address',
                    isVerified: true,
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
            wallet: {
                receive: state,
            },
        };

        expect(selectReceiveRevealedAddresses(loadedState, bitcoinAccount.key)).toEqual([
            {
                path: 'btc-path',
                address: 'btc-address',
                isVerified: true,
            },
        ]);
        expect(selectCurrentFreshAddress(loadedState, bitcoinAccount.key)).toBeUndefined();
        expect(selectReceiveRevealedAddresses(loadedState)).toEqual([]);
        expect(selectCurrentFreshAddress(loadedState)).toBeUndefined();
    });
});
