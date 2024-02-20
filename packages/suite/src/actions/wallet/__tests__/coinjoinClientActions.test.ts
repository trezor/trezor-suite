import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, initPreloadedState, testMocks } from '@suite-common/test-utils';
import { promiseAllSequence } from '@trezor/utils';
import { prepareMessageSystemReducer } from '@suite-common/message-system';

import { db } from 'src/storage';
import { accountsReducer } from 'src/reducers/wallet';
import { coinjoinReducer } from 'src/reducers/wallet/coinjoinReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import modalReducer from 'src/reducers/suite/modalReducer';
import { coinjoinMiddleware } from 'src/middlewares/wallet/coinjoinMiddleware';
import { CoinjoinService } from 'src/services/coinjoin/coinjoinService';

import {
    initCoinjoinService,
    onCoinjoinRoundChanged,
    onCoinjoinClientRequest,
    setDebugSettings,
    clientEmitException,
    pauseCoinjoinSession,
    stopCoinjoinSession,
} from '../coinjoinClientActions';
import * as fixtures from '../__fixtures__/coinjoinClientActions';

const TrezorConnect = testMocks.getTrezorConnectMock();
jest.mock('src/services/coinjoin/coinjoinService', () => {
    const mock = jest.requireActual('../__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);

const rootReducer = combineReducers({
    suite: createReducer(
        {
            locks: [],
            settings: {
                debug: {},
            },
        },
        () => ({}),
    ),
    device: createReducer(
        { devices: [fixtures.DEVICE], selectedDevice: fixtures.DEVICE },
        () => ({}),
    ),
    modal: modalReducer,
    messageSystem: messageSystemReducer,
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: accountsReducer,
        selectedAccount: selectedAccountReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & {
    device?: State['device'];
    suite?: State['suite'];
};

const initStore = ({ accounts, coinjoin, device, selectedAccount, suite }: Wallet = {}) => {
    // State != suite AppState, therefore <any>
    const store = configureMockStore<any>({
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                suite,
                device,
                wallet: {
                    accounts,
                    coinjoin,
                    selectedAccount,
                },
            },
        }),
        middleware: [coinjoinMiddleware],
    });

    return store;
};

describe('coinjoinClientActions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    beforeAll(async () => {
        await db.getDB();
    });

    fixtures.onCoinjoinRoundChanged.forEach(f => {
        it(`onCoinjoinRoundChanged: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);
            testMocks.setTrezorConnectFixtures(f.connect);

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
                expect(TrezorConnect.setBusy).toHaveBeenCalledTimes(
                    f.result.trezorConnectCalledTimes,
                );
            }
            if (f.result.trezorConnectCallsWith) {
                expect(TrezorConnect.setBusy).toHaveBeenLastCalledWith(
                    expect.objectContaining(f.result.trezorConnectCallsWith),
                );
            }
        });
    });

    fixtures.getOwnershipProof.forEach(f => {
        it(`getOwnershipProof: ${f.description}`, async () => {
            const store = initStore(f.state as any); // params are incomplete
            testMocks.setTrezorConnectFixtures(f.connect);

            const response = await store.dispatch(onCoinjoinClientRequest(f.params as any));

            expect(response).toMatchObject(f.result.response);

            expect(TrezorConnect.getOwnershipProof).toHaveBeenCalledTimes(
                f.result.trezorConnectCalledTimes,
            );
        });
    });

    fixtures.signCoinjoinTx.forEach(f => {
        it(`signCoinjoinTx: ${f.description}`, async () => {
            const store = initStore(f.state as any);
            testMocks.setTrezorConnectFixtures(f.connect);

            const [response] = await store.dispatch(
                onCoinjoinClientRequest([f.params as any]), // params are incomplete
            );

            expect(TrezorConnect.signTransaction).toHaveBeenCalledTimes(
                f.result.trezorConnectCalledTimes,
            );

            f.result.trezorConnectCalledWith.forEach((params, index) => {
                expect(TrezorConnect.signTransaction.mock.calls[index][0]).toMatchObject(params);
            });

            expect(response).toMatchObject(f.result.response);
        });
    });

    it('initCoinjoinService and restore prison', async () => {
        const store = initStore({
            accounts: [
                {
                    key: 'account-A',
                    symbol: 'btc',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 5,
                        },
                    ],
                    addresses: {
                        change: [
                            { address: 'A1', transfers: 1 },
                            { address: 'A2', transfers: 0 },
                            { address: 'A2', transfers: 0 },
                        ],
                    },
                },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    {
                        key: 'account-A',
                        symbol: 'btc',
                        prison: {
                            '000000': { type: 'input', sentenceEnd: Infinity },
                            A1: { type: 'output', sentenceEnd: Infinity },
                            A2: { type: 'output', sentenceEnd: Infinity },
                            A3: { type: 'output', sentenceEnd: 10000 },
                        },
                    },
                    {
                        key: 'account-B',
                        symbol: 'btc',
                        prison: {},
                    },
                ],
                debug: {
                    coinjoinServerEnvironment: { btc: 'staging' },
                },
            },
        } as any); // partial required state

        const spy = jest.spyOn(CoinjoinService, 'createInstance');
        const cli1 = await store.dispatch(initCoinjoinService('btc'));
        const cli2 = await store.dispatch(initCoinjoinService('btc'));
        expect(cli1).toEqual(cli2);
        expect(spy.mock.calls[0][0]).toEqual({
            environment: 'staging',
            network: 'btc',
            prison: [
                {
                    accountKey: 'account-A',
                    id: 'A2',
                    sentenceEnd: Infinity,
                    type: 'output',
                },
                {
                    accountKey: 'account-A',
                    id: 'A3',
                    sentenceEnd: 10000,
                    type: 'output',
                },
            ],
        });
        spy.mockClear();

        // for coverage, init same instance multiple times without waiting
        store.dispatch(initCoinjoinService('test')).then(cli3 => {
            expect(cli3?.client.settings.network).toEqual('test');
        });
        const cli3a = await store.dispatch(initCoinjoinService('test'));
        expect(cli3a).toBe(undefined); // undefined because cli3 is not loaded yet
    });

    it('initCoinjoinService and throw error', async () => {
        const store = initStore();
        const cli = await store.dispatch(initCoinjoinService('ltc')); // ltc not supported
        expect(cli).toBe(undefined);
    });

    it('initCoinjoinService and fail to enable', async () => {
        const store = initStore();
        const spy = jest.spyOn(CoinjoinService, 'createInstance').mockImplementationOnce(
            () =>
                ({
                    client: {
                        enable: () => Promise.resolve({ success: false, error: 'Some error' }),
                    },
                }) as any,
        );
        const cli = await store.dispatch(initCoinjoinService('btc'));
        expect(cli).toBe(undefined);
        spy.mockClear();
    });

    fixtures.clientEvents.forEach(f => {
        it(`CoinjoinClient events: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            const cli = await store.dispatch(initCoinjoinService('btc'));
            cli?.client.emit(f.event as any, f.params);

            expect(store.getState().wallet.coinjoin).toMatchObject(f.result);
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

        expect(cli1.client.emit).toHaveBeenCalledTimes(1);
        expect(cli2.client.emit).toHaveBeenCalledTimes(1);
        expect(cli2.client.emit).toHaveBeenCalledWith('log', {
            level: 'error',
            payload: 'Some exception',
        });

        store.dispatch(clientEmitException('Other exception', { symbol: 'btc' }));

        expect(cli1.client.emit).toHaveBeenCalledTimes(2);
        expect(cli2.client.emit).toHaveBeenCalledTimes(1);
    });

    it('clientEmitException from coinjoinMiddleware', async () => {
        const initializeStore = () =>
            initStore({
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
                        },
                    ],
                } as any,
            });

        const store = initializeStore();

        const cli = await store.dispatch(initCoinjoinService('btc'));

        if (!cli) throw new Error('Client not initialized');

        store.dispatch({ type: '@suite/online-status', payload: false });
        expect(cli.client.emit).toHaveBeenCalledTimes(1);

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
        expect(cli.client.emit).toHaveBeenCalledTimes(2);

        restoreSession();
        store.dispatch({ type: 'device-disconnect', payload: { id: 'device-id' } });
        expect(cli.client.emit).toHaveBeenCalledTimes(3);

        // previous action stops the session
        const store2 = initializeStore();

        store2.dispatch({
            type: '@common/wallet-core/accounts/removeAccount',
            payload: [{ key: 'btc-account1' }],
        });
        expect(cli.client.emit).toHaveBeenCalledTimes(4);
    });

    // for coverage: edge cases, missing data etc...
    it('pauseCoinjoinSession without related account', () => {
        const store = initStore();
        store.dispatch(pauseCoinjoinSession('account-Z'));
    });

    it('stopCoinjoinSession without connected device', async () => {
        const store = initStore({
            accounts: [{ key: 'account-A', symbol: 'btc' }],
        } as any);

        testMocks.setTrezorConnectFixtures([{ success: false }]);

        await store.dispatch(initCoinjoinService('btc'));

        store.dispatch(stopCoinjoinSession('account-A'));
    });

    it('stopCoinjoinSession with error from Trezor', async () => {
        const store = initStore({
            accounts: [{ key: 'account-A', symbol: 'btc', deviceState: 'device-state' }],
        } as any);

        testMocks.setTrezorConnectFixtures([
            { success: false, payload: { error: 'Firmware error' } },
        ]);

        await store.dispatch(initCoinjoinService('btc'));

        store.dispatch(stopCoinjoinSession('account-A'));

        expect(TrezorConnect.cancelCoinjoinAuthorization).toHaveBeenCalledTimes(1);
    });

    it('stopCoinjoinSession but not cancel authorization', async () => {
        const store = initStore({
            device: {
                devices: [fixtures.DEVICE, { ...fixtures.DEVICE, state: 'device-state-2' }],
            },
            accounts: [
                {
                    key: 'account-A',
                    accountType: 'coinjoin',
                    symbol: 'btc',
                    deviceState: 'device-state',
                },
                {
                    key: 'account-B',
                    accountType: 'coinjoin',
                    symbol: 'btc',
                    deviceState: 'device-state-2',
                },
            ],
            coinjoin: {
                accounts: [
                    { key: 'account-A', session: {} },
                    { key: 'account-B', session: {} },
                ],
            },
        } as any);

        await store.dispatch(initCoinjoinService('btc'));

        store.dispatch(stopCoinjoinSession('account-A'));

        expect(TrezorConnect.cancelCoinjoinAuthorization).toHaveBeenCalledTimes(0);
    });

    it('CoinjoinClient events', async () => {
        const store = initStore();
        const cli = await store.dispatch(initCoinjoinService('btc'));

        // other requests are covered by fixtures.getOwnershipProof and fixtures.signCoinjoinTx
        cli?.client.emit('request', [{ type: 'unknown' } as any]);

        cli?.client.emit('log', { level: 'warn', payload: 'Warn' });
        cli?.client.emit('log', { level: 'error', payload: 'Error' });
    });
});
