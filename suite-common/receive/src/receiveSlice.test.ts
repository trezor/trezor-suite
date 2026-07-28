import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { accountsActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';

import {
    type ReceiveAccountState,
    type ReceiveState,
    prepareReceiveReducer,
    receiveActions,
    selectCurrentFreshAddress,
    selectTouchedAddresses,
} from './receiveSlice';

const bitcoinAccount = mockWalletAccount({ symbol: 'btc' });
const ethereumAccount = mockWalletAccount({ symbol: 'eth' }, networkSpecificDefaultEthereum);
const extraDependencies = {
    ...extraDependenciesCommonMock,
    reducers: {
        ...extraDependenciesCommonMock.reducers,
        storageLoadReceiveAccounts: (
            state: ReceiveState,
            {
                payload,
            }: {
                payload: {
                    receive?: { key: string; value: ReceiveAccountState }[];
                };
            },
        ) => {
            state.accounts =
                payload.receive?.reduce<ReceiveState['accounts']>((accounts, { key, value }) => {
                    accounts[key as AccountKey] = value;

                    return accounts;
                }, {}) ?? {};
        },
    },
};
const receiveReducer = prepareReceiveReducer(extraDependencies);

describe('receiveSlice', () => {
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
            receiveActions.showAddress({
                accountKey: bitcoinAccount.key,
                path: 'used-btc',
                address: 'btc-used-address',
            }),
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
            receiveActions.showAddress({
                accountKey: bitcoinAccount.key,
                path: 'path-1',
                address: 'address-1',
            }),
        );

        expect(state.accounts[bitcoinAccount.key]?.touchedAddresses).toEqual([
            {
                path: 'path-1',
                address: 'address-1',
            },
        ]);

        state = receiveReducer(
            state,
            receiveActions.showAddress({
                accountKey: bitcoinAccount.key,
                path: 'path-1',
                address: 'address-1',
            }),
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
            receiveActions.showAddress({
                accountKey: bitcoinAccount.key,
                path: 'btc-path',
                address: 'btc-address',
            }),
        );
        state = receiveReducer(
            state,
            receiveActions.showAddress({
                accountKey: ethereumAccount.key,
                path: 'eth-path',
                address: 'eth-address',
            }),
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
            receiveActions.showAddress({
                accountKey: bitcoinAccount.key,
                path: 'btc-path',
                address: 'btc-address',
            }),
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
