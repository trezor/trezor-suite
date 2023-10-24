import { combineReducers } from '@reduxjs/toolkit';

import { ExtraDependenciesPartial } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

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

describe('Account Reducer', () => {
    // accountActions.createAccount function is already tested by "discoveryActions"
    // it's pointless to write a complex tests for it
    it('Create account', () => {
        const store = initStore();
        store.dispatch(
            accountsActions.createAccount({
                deviceState: 'device-state',
                discoveryItem: {
                    index: 0,
                    path: "m/84'/0'/0'",
                    accountType: 'normal',
                    networkType: 'bitcoin',
                    coin: 'btc',
                },
                accountInfo: {
                    descriptor: 'XPUB',
                    path: "m/84'/0'/0'",
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
            }),
        );
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });

    it('Change account visibility', () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    accounts: [getAccount({ symbol: 'ltc', path: '1', visible: false }) as Account],
                },
            },
        });

        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: 'ltc',
                    path: '1',
                    visible: false,
                }) as Account,
            ),
        );
        expect(store.getState().wallet.accounts[0]).toEqual(
            getAccount({ symbol: 'ltc', path: '1', visible: true }),
        );
    });

    it('Change account visibility (account not found)', () => {
        const store = initStore();
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        store.dispatch(
            accountsActions.changeAccountVisibility(
                getAccount({
                    symbol: 'ltc',
                    path: '1',
                    visible: false,
                }) as Account,
            ),
        );
        expect(spyWarn).toHaveBeenCalledTimes(1);
        spyWarn.mockRestore();

        expect(store.getState().wallet.accounts.length).toEqual(0);
    });
});
