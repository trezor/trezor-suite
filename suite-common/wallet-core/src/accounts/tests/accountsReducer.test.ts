import { combineReducers } from '@reduxjs/toolkit';

import { ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';
import { Bip43Path } from '@suite-common/wallet-config';

import { accountsActions } from '../accountsActions';
import { AccountsRootState, prepareAccountsReducer } from '../accountsReducer';

const accountsReducer = prepareAccountsReducer(extraDependenciesMock);

interface InitStoreArgs {
    extra?: ExtraDependenciesPartial;
    preloadedState?: AccountsRootState;
}

const initStore = ({ extra = {}, preloadedState }: InitStoreArgs = {}) => {
    const store = configureMockStore({
        extra,
        reducer: { wallet: combineReducers({ accounts: accountsReducer }) },
        preloadedState,
    });

    return store;
};
const getAccount = (a?: Partial<Account>) => ({
    descriptor: 'xpubDeFauLT1',
    symbol: 'btc',
    history: {},
    ...a,
});

const testBip43Path: Bip43Path = "m/84'/0'/0'";

describe('Account Reducer', () => {
    // accountActions.createAccount function is already tested by "discoveryActions"
    // it's pointless to write a complex tests for it
    it('Create account', () => {
        const store = initStore();
        store.dispatch(
            accountsActions.createAccount({
                deviceState: '1stTestnetAddress@device_id:0',
                discoveryItem: {
                    index: 0,
                    path: testBip43Path,
                    accountType: 'normal',
                    networkType: 'bitcoin',
                    coin: 'btc',
                },
                accountInfo: {
                    descriptor: 'XPUB',
                    path: testBip43Path,
                    empty: false,
                    balance: '0',
                    availableBalance: '0',
                    tokens: [],
                    history: {
                        total: 0,
                        transactions: [],
                        unconfirmed: 0,
                    },
                },
                visible: true,
            }),
        );
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });

    it('Change account visibility', () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    accounts: [
                        getAccount({
                            symbol: 'ltc',
                            path: testBip43Path,
                            visible: false,
                        }) as Account,
                    ],
                },
            },
        });

        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: 'ltc',
                    path: testBip43Path,
                    visible: false,
                }) as Account,
            ),
        );
        expect(store.getState().wallet.accounts[0]).toEqual(
            getAccount({ symbol: 'ltc', path: testBip43Path, visible: true }),
        );
    });

    it('Change account visibility (account not found)', () => {
        const store = initStore();
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: 'ltc',
                    path: testBip43Path,
                    visible: false,
                }) as Account,
            ),
        );
        expect(spyWarn).toHaveBeenCalledTimes(1);
        spyWarn.mockRestore();

        expect(store.getState().wallet.accounts.length).toEqual(0);
    });
});
