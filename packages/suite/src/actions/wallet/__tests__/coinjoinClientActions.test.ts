import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { promiseAllSequence } from '@trezor/utils';

import { accountsReducer } from 'src/reducers/wallet';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { extraDependencies } from 'src/support/extraDependencies';
import modalReducer from 'src/reducers/suite/modalReducer';
import {
    initCoinjoinService,
    onCoinjoinRoundChanged,
    onCoinjoinClientRequest,
    signCoinjoinTx,
    setDebugSettings,
    clientEmitException,
} from '../coinjoinClientActions';
import * as fixtures from '../__fixtures__/coinjoinClientActions';
import { coinjoinMiddleware } from 'src/middlewares/wallet/coinjoinMiddleware';

jest.mock('@trezor/connect', () => global.JestMocks.getTrezorConnect({}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TrezorConnect = require('@trezor/connect').default;

jest.mock('src/services/coinjoin/coinjoinService', () => {
    const mock = jest.requireActual('../__fixtures__/mockCoinjoinService');
    return mock.mockCoinjoinService();
});

const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            device: fixtures.DEVICE,
            settings: {
                debug: {},
            },
        },
        () => ({}),
    ),
    devices: createReducer([fixtures.DEVICE], () => ({})),
    modal: modalReducer,
    messageSystem: messageSystemReducer,
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & { devices?: State['devices'] };

const initStore = ({ accounts, coinjoin, devices, selectedAccount }: Wallet = {}) => {
    // TODO: didn't found better way how to generate initial state or pass it dynamically to rootReducer creator
    const preloadedState: State = JSON.parse(
        JSON.stringify(rootReducer(undefined, { type: 'init' })),
    );
    if (devices) {
        preloadedState.devices = devices;
    }
    if (accounts) {
        preloadedState.wallet.accounts = accounts;
    }
    if (coinjoin) {
        preloadedState.wallet.coinjoin = {
            ...preloadedState.wallet.coinjoin,
            ...coinjoin,
        };
    }
    if (selectedAccount) {
        preloadedState.wallet.selectedAccount = selectedAccount;
    }
    // State != suite AppState, therefore <any>
    const store = configureMockStore<any>({
        reducer: rootReducer,
        preloadedState,
        middleware: [coinjoinMiddleware],
    });
    return store;
};

describe('coinjoinClientActions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    fixtures.onCoinjoinRoundChanged.forEach(f => {
        it(`onCoinjoinRoundChanged: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            TrezorConnect.setTestFixtures(f.connect);

            if (Array.isArray(f.params)) {
                await promiseAllSequence(
                    f.params.map(
                        (round: any) => () =>
                            store.dispatch(
                                onCoinjoinRoundChanged({ round }), // params are incomplete
                            ),
                    ),
                );
            } else {
                await store.dispatch(
                    onCoinjoinRoundChanged({ round: f.params as any }), // params are incomplete
                );
            }

            const actions = store.getActions();
            expect(actions.map(a => a.type)).toEqual(f.result.actions);

            if (typeof f.result.trezorConnectCalledTimes === 'number') {
                expect(TrezorConnect.setBusy).toBeCalledTimes(f.result.trezorConnectCalledTimes);
            }
            if (f.result.trezorConnectCallsWith) {
                expect(TrezorConnect.setBusy).toHaveBeenLastCalledWith(
                    expect.objectContaining(f.result.trezorConnectCallsWith),
                );
            }
        });
    });

    fixtures.onCoinjoinClientRequest.forEach(f => {
        it(`onCoinjoinClientRequest: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            TrezorConnect.setTestFixtures(f.connect);

            const response = await store.dispatch(onCoinjoinClientRequest(f.params as any));

            expect(response).toMatchObject(f.result.response);

            expect(TrezorConnect.getOwnershipProof).toBeCalledTimes(
                f.result.trezorConnectCalledTimes,
            );
        });
    });

    fixtures.signCoinjoinTx.forEach(f => {
        it(`signCoinjoinTx: ${f.description}`, async () => {
            const store = initStore(f.state as any);
            TrezorConnect.setTestFixtures(f.connect);

            const response = await store.dispatch(
                signCoinjoinTx(f.params as any), // params are incomplete
            );

            expect(TrezorConnect.signTransaction).toBeCalledTimes(
                f.result.trezorConnectCalledTimes,
            );

            f.result.trezorConnectCalledWith.forEach((params, index) => {
                expect(TrezorConnect.signTransaction.mock.calls[index][0]).toMatchObject(params);
            });

            expect(response).toMatchObject(f.result.response);
        });
    });

    it('setDebugSettings', () => {
        const store = initStore();
        expect(store.getState().wallet.coinjoin.debug).toBeUndefined();

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { test: 'public' } }));

        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public' },
        });

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { regtest: 'localhost' } }));
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public', regtest: 'localhost' },
        });

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { test: 'staging' } }));
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'staging', regtest: 'localhost' },
        });
    });

    it('clientEmitException', async () => {
        const store = initStore();

        const cli1 = await store.dispatch(initCoinjoinService('btc'));
        const cli2 = await store.dispatch(initCoinjoinService('test'));

        if (!cli1 || !cli2) throw new Error('Client not initialized');

        store.dispatch(clientEmitException('Some exception'));

        expect(cli1.client.emit).toBeCalledTimes(1);
        expect(cli2.client.emit).toBeCalledTimes(1);
        expect(cli2.client.emit).toBeCalledWith('log', {
            level: 'error',
            payload: 'Some exception',
        });

        store.dispatch(clientEmitException('Other exception', { symbol: 'btc' }));

        expect(cli1.client.emit).toBeCalledTimes(2);
        expect(cli2.client.emit).toBeCalledTimes(1);
    });

    it('clientEmitException from coinjoinMiddleware', async () => {
        const store = initStore({
            accounts: [
                testMocks.getWalletAccount({
                    deviceState: 'device-state',
                    accountType: 'coinjoin',
                    key: 'btc-account1',
                    symbol: 'btc',
                }),
            ],
            coinjoin: {
                accounts: [
                    {
                        key: 'btc-account1',
                        symbol: 'btc',
                        session: { roundPhase: 1, signedRounds: [], maxRounds: 10 },
                        previousSessions: [],
                    },
                ],
            } as any,
        });

        const cli = await store.dispatch(initCoinjoinService('btc'));

        if (!cli) throw new Error('Client not initialized');

        store.dispatch({ type: '@suite/online-status', payload: false });
        expect(cli.client.emit).toBeCalledTimes(1);

        // restore session after previous action, and set phase to critical again
        // NOTE: dispatching { type: '@suite/tor-status', payload: 'Enabled' } requires a lot more fixtures
        const restoreSession = () => {
            store.dispatch({
                type: '@coinjoin/session-restore',
                payload: { accountKey: 'btc-account1' },
            });
            store.dispatch({
                type: '@coinjoin/session-round-changed',
                payload: { accountKey: 'btc-account1', round: { phase: 1 } },
            });
        };

        restoreSession();
        store.dispatch({ type: '@suite/tor-status', payload: 'Disabled' });
        expect(cli.client.emit).toBeCalledTimes(2);

        restoreSession();
        store.dispatch({ type: 'device-disconnect', payload: { id: 'device-id' } });
        expect(cli.client.emit).toBeCalledTimes(3);

        restoreSession();
        store.dispatch({
            type: '@common/wallet-core/accounts/removeAccount',
            payload: [{ key: 'btc-account1' }],
        });
        expect(cli.client.emit).toBeCalledTimes(4);
    });
});
