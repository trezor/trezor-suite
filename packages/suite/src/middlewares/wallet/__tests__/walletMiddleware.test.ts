import { RouterState } from '@suite/router';
import { extraDependenciesCommonMock, testMocks } from '@suite-common/test-utils';
import {
    SendState,
    prepareBlockchainMiddleware,
    prepareSendFormReducer,
} from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import walletMiddleware from 'src/middlewares/wallet/walletMiddleware';
import { accountsReducer, blockchainReducer, walletSettingsReducer } from 'src/reducers/wallet';
import formDraftReducer from 'src/reducers/wallet/formDraftReducer';
import selectedAccountReducer, {
    State as SelectedAccountState,
} from 'src/reducers/wallet/selectedAccountReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore } from 'src/support/tests/configureStore';
import { Action } from 'src/types/suite';

import * as fixtures from '../__fixtures__/walletMiddleware';

const sendFormReducer = prepareSendFormReducer(extraDependencies);

const TrezorConnect = testMocks.getTrezorConnectMock();

type AccountsState = ReturnType<typeof accountsReducer>;
type SettingsState = ReturnType<typeof walletSettingsReducer>;

interface Args {
    router?: Partial<RouterState>;
    accounts?: AccountsState;
    settings?: Partial<SettingsState>;
    selectedAccount?: Partial<SelectedAccountState>;
    send?: Partial<SendState>;
}

const getInitialState = ({ router, accounts, settings, selectedAccount, send }: Args = {}) => ({
    router: {
        app: 'wallet',
        route: {
            name: 'wallet-index',
        },
        ...router,
    },
    suite: {},
    device: {
        device: true, // device is irrelevant in this test
    },
    wallet: {
        accounts: accounts || accountsReducer(undefined, { type: 'foo' } as any),
        blockchain: blockchainReducer(undefined, { type: 'foo' } as any),
        settings: {
            ...walletSettingsReducer(undefined, { type: 'foo' } as any),
            ...settings,
        },
        selectedAccount: {
            ...selectedAccountReducer(undefined, { type: 'foo' } as any),
            ...selectedAccount,
            status: 'loaded',
        },
        send: { ...sendFormReducer(undefined, { type: 'foo' } as any), ...send },
        formDrafts: {},
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, Action>([
    walletMiddleware,
    prepareBlockchainMiddleware(() => extraDependenciesCommonMock),
]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { accounts, blockchain, settings, selectedAccount, send, formDrafts } =
            store.getState().wallet;
        store.getState().wallet = {
            accounts: accountsReducer(accounts, action),
            blockchain: blockchainReducer(blockchain, action),
            settings: walletSettingsReducer(settings, action),
            selectedAccount: selectedAccountReducer(selectedAccount as any, action),
            send: sendFormReducer(send, action),
            formDrafts: formDraftReducer(formDrafts, { type: 'foo' } as any),
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
            const initialAccounts = f.initialAccounts.map((a: any) => mockWalletAccount(a));
            const store = initStore(
                getInitialState({
                    accounts: initialAccounts,
                }),
            );

            f.actions.forEach((action: any) => {
                const payload = Array.isArray(action.payload)
                    ? // @ts-expect-error
                      action.payload.map(a => mockWalletAccount(a))
                    : mockWalletAccount(action.payload);
                store.dispatch({ ...action, payload });
            });

            const { subscribe, disconnect } = f.result;
            if (subscribe) {
                expect(TrezorConnect.blockchainSubscribe).toHaveBeenCalledTimes(subscribe.called);
                if (subscribe.called) {
                    const accounts = subscribe.accounts?.map(a => mockWalletAccount(a)) ?? [];
                    expect(TrezorConnect.blockchainSubscribe).toHaveBeenLastCalledWith(
                        expect.objectContaining({
                            accounts: accounts.map(a => expect.objectContaining(a)),
                            coin: subscribe.coin,
                        }),
                    );
                }
            }

            if (disconnect) {
                expect(TrezorConnect.blockchainDisconnect).toHaveBeenCalledTimes(disconnect.called);
            }
        });
    });

    it('have send form drafts, change amount units, return to a form', () => {
        fixtures.draftsFixtures.forEach(
            ({ initialState, action, expectedActions, expectedDrafts }) => {
                const store = initStore(getInitialState(initialState));

                store.dispatch(action);

                // Omit irrelevant `metadata` property so it does not have to be included in the fixtures.
                const capturedActions = store.getActions().map(action => ({
                    type: action.type,
                    payload: action.payload,
                }));

                expect(capturedActions).toEqual(expectedActions);
                expect(store.getState().wallet.send?.drafts).toEqual(expectedDrafts);
            },
        );
    });
});
