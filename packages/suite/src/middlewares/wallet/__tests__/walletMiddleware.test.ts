/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import accountsReducer from '@wallet-reducers/accountsReducer';
import walletSettingsReducer from '@wallet-reducers/settingsReducer';
import blockchainReducer from '@wallet-reducers/blockchainReducer';
import walletMiddleware from '@wallet-middlewares/walletMiddleware';
import blockchainMiddleware from '@wallet-middlewares/blockchainMiddleware';
import { Action } from '@suite-types';
import * as fixtures from '../__fixtures__/walletMiddleware';

const { getWalletAccount } = global.JestMocks;

jest.mock('trezor-connect', () => global.JestMocks.getTrezorConnect({}));
const TrezorConnect = require('trezor-connect').default;

type AccountsState = ReturnType<typeof accountsReducer>;
type SettingsState = ReturnType<typeof walletSettingsReducer>;
interface Args {
    accounts?: AccountsState;
    settings?: Partial<SettingsState>;
}

export const getInitialState = ({ accounts, settings }: Args = {}) => ({
    router: {
        app: 'wallet',
    },
    suite: {
        device: true, // device is irrelevant in this test
    },
    wallet: {
        accounts: accounts || accountsReducer(undefined, { type: 'foo' } as any),
        blockchain: blockchainReducer(undefined, { type: 'foo' } as any),
        settings: {
            ...walletSettingsReducer(undefined, { type: 'foo' } as any),
            ...settings,
        },
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([thunk, walletMiddleware, blockchainMiddleware]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { accounts, blockchain, settings } = store.getState().wallet;
        store.getState().wallet = {
            accounts: accountsReducer(accounts, action),
            blockchain: blockchainReducer(blockchain, action),
            settings: walletSettingsReducer(settings, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

// testing walletMiddleware, blockchainActions (subscribe/unsubscribe)
describe('walletMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.blockchainSubscription.forEach(f => {
        it(f.description, () => {
            // @ts-ignore
            const initialAccounts = f.initialAccounts.map((a: any) => getWalletAccount(a));
            const store = initStore(
                getInitialState({
                    accounts: initialAccounts,
                }),
            );

            f.actions.forEach((action: any) => {
                const payload = Array.isArray(action.payload)
                    ? // @ts-ignore
                      action.payload.map(a => getWalletAccount(a))
                    : getWalletAccount(action.payload);
                store.dispatch({ ...action, payload });
            });

            const { subscribe, disconnect } = f.result;
            if (subscribe) {
                expect(TrezorConnect.blockchainSubscribe).toBeCalledTimes(subscribe.called);
                if (subscribe.called) {
                    // @ts-ignore
                    const accounts = subscribe.accounts?.map(a => getWalletAccount(a));
                    expect(TrezorConnect.blockchainSubscribe).toHaveBeenLastCalledWith({
                        accounts,
                        coin: subscribe.coin,
                    });
                }
            }

            if (disconnect) {
                expect(TrezorConnect.blockchainDisconnect).toBeCalledTimes(disconnect.called);
            }
        });
    });
});
