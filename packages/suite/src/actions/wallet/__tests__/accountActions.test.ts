import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import accountsReducer from '@wallet-reducers/accountsReducer';
import walletSettingsReducer from '@wallet-reducers/settingsReducer';
import * as accountActions from '../accountActions';
import { Account } from '@wallet-types';

type AccountsState = ReturnType<typeof accountsReducer>;
type SettingsState = ReturnType<typeof walletSettingsReducer>;
interface Args {
    accounts?: AccountsState;
    settings?: Partial<SettingsState>;
}

export const getInitialState = ({ accounts, settings }: Args = {}) => ({
    suite: {
        device: true,
    },
    wallet: {
        accounts: accounts || accountsReducer(undefined, { type: 'foo' } as any),
        settings: {
            ...walletSettingsReducer(undefined, { type: 'foo' } as any),
            ...settings,
        },
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { accounts, settings } = store.getState().wallet;
        store.getState().wallet = {
            accounts: accountsReducer(accounts, action),
            settings: walletSettingsReducer(settings, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

const getAccount = (a?: Partial<Account>) => ({
    descriptor: 'xpubDeFauLT1',
    symbol: 'btc',
    ...a,
});

describe('Account Actions', () => {
    // accountActions.create function is already tested by "discoveryActions"
    // it's pointless to write a complex tests for it
    it('Create account', () => {
        const store = initStore(getInitialState());
        store.dispatch(
            accountActions.create(
                'device-state',
                {
                    index: 0,
                    path: "m/84'/0'/0'",
                    accountType: 'normal',
                    networkType: 'bitcoin',
                    coin: 'btc',
                },
                {
                    descriptor: 'XPUB',
                    path: "m/84'/0'/0'",
                    empty: false,
                    balance: '0',
                    availableBalance: '0',
                    tokens: [],
                    history: {
                        total: 0,
                        transactions: [],
                    },
                },
            ),
        );
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });

    it('Disable accounts (all removed)', () => {
        const store = initStore(
            getInitialState({
                accounts: [getAccount() as Account, getAccount() as Account],
                settings: {
                    enabledNetworks: ['ltc'],
                },
            }),
        );
        store.dispatch(accountActions.disableAccounts());
        expect(store.getState().wallet.accounts.length).toEqual(0);
    });

    it('Disable accounts (not all removed)', () => {
        const store = initStore(
            getInitialState({
                accounts: [getAccount({ symbol: 'ltc' }) as Account, getAccount() as Account],
                settings: {
                    enabledNetworks: ['ltc'],
                },
            }),
        );
        store.dispatch(accountActions.disableAccounts());
        expect(store.getState().wallet.accounts.length).toEqual(1);
    });

    it('Change account visibility', () => {
        const store = initStore(
            getInitialState({
                accounts: [getAccount({ symbol: 'ltc', path: '1', visible: false }) as Account],
            }),
        );
        store.dispatch(
            accountActions.changeAccountVisibility(
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
        const store = initStore(getInitialState());
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        store.dispatch(
            accountActions.changeAccountVisibility(
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
