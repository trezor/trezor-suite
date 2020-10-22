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

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSubscribe: jest.fn(async _params => {
                return { success: true, ...fixture };
            }),
            blockchainSubscribeFiatRates: jest.fn(async _params => {
                return { success: true };
            }),
            blockchainUnsubscribeFiatRates: jest.fn(async _params => {
                return { success: true };
            }),
            blockchainDisconnect: jest.fn(async _params => {
                return { success: true };
            }),
            blockchainEstimateFee: jest.fn(async _params => {
                return { success: true };
            }),
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DEVICE: {},
        BLOCKCHAIN: {
            CONNECT: 'bl-connect',
            BLOCK: 'bl-block',
            NOTIFICATION: 'notif',
            ERROR: 'err',
        },
    };
});

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

    // TODO: this is failing on fiatRatesActions (missing reducer)
    // it('connect', () => {
    //     const store = initStore(getInitialState());
    //     store.dispatch({ type: BLOCKCHAIN.CONNECT, payload: { coin: { shortcut: 'btc' } } });
    // });

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

            const { blockchainSubscribe, blockchainDisconnect } = require('trezor-connect').default;
            const { subscribe, disconnect } = f.result;
            if (subscribe) {
                expect(blockchainSubscribe).toBeCalledTimes(subscribe.called);
                if (subscribe.called) {
                    // @ts-ignore
                    const accounts = subscribe.accounts?.map(a => getWalletAccount(a));
                    expect(blockchainSubscribe).toHaveBeenLastCalledWith({
                        accounts,
                        coin: subscribe.coin,
                    });
                }
            }

            if (disconnect) {
                expect(blockchainDisconnect).toBeCalledTimes(disconnect.called);
            }
        });
    });
});
