import { type SelectedAccountState, selectedAccountReducer } from '@suite/account';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type RouterState } from '@suite/router';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockGetIsWindowVisible } from '@suite-common/suite-types/mocks';
import { createTestStore, testMocks } from '@suite-common/test-utils';
import {
    type SendState,
    accountsRefreshTimeReducer,
    blockchainActions,
    formDraftInitialState,
    prepareBlockchainMiddleware,
    prepareSendFormReducer,
} from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module';

import { updateWindowVisibility } from 'src/actions/suite/windowActions';
import walletMiddleware from 'src/middlewares/wallet/walletMiddleware';
import { accountsReducer, blockchainReducer, walletSettingsReducer } from 'src/reducers/wallet';

import * as fixtures from './__fixtures__/walletMiddleware';

const sendFormReducer = prepareSendFormReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFormDrafts: mockReducer() },
});

const TrezorConnect = testMocks.getTrezorConnectMock();
const ethSymbol = asNetworkSymbol('eth');

type AccountsState = ReturnType<typeof accountsReducer>;
type SettingsState = ReturnType<typeof walletSettingsReducer>;

interface Args {
    router?: Partial<RouterState>;
    accounts?: AccountsState;
    settings?: Partial<SettingsState>;
    selectedAccount?: Partial<SelectedAccountState>;
    send?: Partial<SendState>;
    transactions?: Record<string, unknown[]>;
    isWindowVisible?: boolean;
}

const getInitialState = ({
    router,
    accounts,
    settings,
    selectedAccount,
    send,
    transactions,
    isWindowVisible = true,
}: Args = {}) => ({
    router: {
        app: 'wallet',
        route: {
            name: 'wallet-index',
        },
        ...router,
    },
    suite: {},
    device: {
        // matches the default deviceState of mockWalletAccount, so the accounts count as
        // belonging to the selected device
        selectedDevice: { state: { staticSessionId: '1stTestnetAddress@device_id:0' } },
    },
    window: {
        isVisible: isWindowVisible,
    },
    wallet: {
        accounts: accounts || accountsReducer(undefined, { type: 'foo' } as any),
        accountsRefreshTime: accountsRefreshTimeReducer(undefined, { type: 'foo' } as any),
        blockchain: blockchainReducer(undefined, { type: 'foo' } as any),
        transactions: {
            transactions: transactions || {},
            phishing: {},
            fetchStatusDetail: {},
        },
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
        formDrafts: formDraftInitialState,
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = (preloadedState: State) =>
    createTestStore({
        extra: {
            services: {
                analytics: mockDesktopAnalytics(),
                getIsWindowVisible: mockGetIsWindowVisible(),
                getTradedAccountKeys: mockGetTradedAccountKeys(),
            },
        },
        middleware: [walletMiddleware, prepareBlockchainMiddleware(() => ({}))],
        // the synced action carries a live timer handle
        serializableCheck: { ignoredActions: [blockchainActions.synced.type] },
        reducer: (state = preloadedState, action) => ({
            ...state,
            wallet: {
                ...state.wallet,
                accounts: accountsReducer(state.wallet.accounts, action),
                accountsRefreshTime: accountsRefreshTimeReducer(
                    state.wallet.accountsRefreshTime,
                    action,
                ),
                blockchain: blockchainReducer(state.wallet.blockchain, action),
                settings: walletSettingsReducer(state.wallet.settings, action),
                selectedAccount: selectedAccountReducer(
                    state.wallet.selectedAccount as any,
                    action,
                ),
                send: sendFormReducer(state.wallet.send, action),
            },
        }),
        preloadedState,
    });

// testing walletMiddleware, blockchainActions (subscribe/unsubscribe)
describe('walletMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.blockchainSubscription.forEach(f => {
        it(f.description, () => {
            const initialAccounts = f.initialAccounts.map((a: any) => mockWalletAccount(a));
            const store = mockStore(
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

    describe('window visibility regain', () => {
        const account = mockWalletAccount({ symbol: ethSymbol });
        const pendingTx = { txid: 'abcd', blockHeight: -1, symbol: ethSymbol };
        const confirmedTx = { txid: 'abcd', blockHeight: 100, symbol: ethSymbol };

        it('refetches a visible account with a pending tx when the window becomes visible', () => {
            const store = mockStore(
                getInitialState({
                    accounts: [account],
                    transactions: { [account.key]: [pendingTx] },
                    isWindowVisible: false,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(1);
        });

        it('does nothing when there is no pending tx', () => {
            const store = mockStore(
                getInitialState({
                    accounts: [account],
                    transactions: { [account.key]: [confirmedTx] },
                    isWindowVisible: false,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });

        it('does nothing when the window was already visible', () => {
            const store = mockStore(
                getInitialState({
                    accounts: [account],
                    transactions: { [account.key]: [pendingTx] },
                    isWindowVisible: true,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });

        it('does nothing when the window is being hidden', () => {
            const store = mockStore(
                getInitialState({
                    accounts: [account],
                    transactions: { [account.key]: [pendingTx] },
                    isWindowVisible: true,
                }),
            );

            store.dispatch(updateWindowVisibility(false));

            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });

        it('re-checks sibling accounts of the network, so a receiver balance updates too', () => {
            const receiver = mockWalletAccount({
                symbol: ethSymbol,
                descriptor: asAccountDescriptor('receiver'),
            });
            const store = mockStore(
                getInitialState({
                    accounts: [account, receiver],
                    transactions: { [account.key]: [pendingTx] },
                    isWindowVisible: false,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(2);
        });

        it('kicks one sync per network even with multiple pending accounts', () => {
            const secondAccount = mockWalletAccount({
                symbol: ethSymbol,
                descriptor: asAccountDescriptor('second'),
            });
            const store = mockStore(
                getInitialState({
                    accounts: [account, secondAccount],
                    transactions: {
                        [account.key]: [pendingTx],
                        [secondAccount.key]: [{ txid: 'efgh', blockHeight: -1, symbol: ethSymbol }],
                    },
                    isWindowVisible: false,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            // one sync of the deduped symbol -> one basic fetch per visible account,
            // not one sync per pending account
            expect(TrezorConnect.getAccountInfo).toHaveBeenCalledTimes(2);
        });

        it('skips accounts that are not visible', () => {
            const hiddenAccount = mockWalletAccount({ symbol: ethSymbol, visible: false });
            const store = mockStore(
                getInitialState({
                    accounts: [hiddenAccount],
                    transactions: { [hiddenAccount.key]: [pendingTx] },
                    isWindowVisible: false,
                }),
            );

            store.dispatch(updateWindowVisibility(true));

            expect(TrezorConnect.getAccountInfo).not.toHaveBeenCalled();
        });
    });

    it('have send form drafts, change amount units, return to a form', () => {
        fixtures.draftsFixtures.forEach(
            ({ initialState, action, expectedActions, expectedDrafts }) => {
                const store = mockStore(getInitialState(initialState));

                store.dispatch(action);

                // Omit irrelevant `metadata` property so it does not have to be included in the fixtures.
                const capturedActions = store.getActions().map(capturedAction => ({
                    type: capturedAction.type,
                    payload: capturedAction.payload,
                }));

                expect(capturedActions).toEqual(expectedActions);
                expect(store.getState().wallet.send?.drafts).toEqual(expectedDrafts);
            },
        );
    });
});
