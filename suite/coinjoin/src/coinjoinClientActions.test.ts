import { type UnknownAction, combineReducers, createReducer } from '@reduxjs/toolkit';

import { selectedAccountReducer } from '@suite/account';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { TorStatus, torActions, torReducer } from '@suite/tor';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore, initPreloadedState, testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { prepareAccountsReducer, prepareWalletSettingsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import '@suite-common/test-utils/globalOverrides';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';
import { promiseAllSequence } from '@trezor/utils';

import * as fixtures from './__fixtures__/coinjoinClientActions';
import {
    clientEmitException,
    initCoinjoinService,
    onCoinjoinClientRequest,
    onCoinjoinRoundChanged,
    pauseCoinjoinSession,
    setDebugSettings,
    stopCoinjoinSession,
} from './coinjoinClientActions';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { coinjoinReducer } from './coinjoinReducer';
import { CoinjoinService } from './coinjoinService';

const TrezorConnect = testMocks.getTrezorConnectMock();
jest.mock('./coinjoinService', () => {
    const mock = jest.requireActual('./__fixtures__/mockCoinjoinService');

    return mock.mockCoinjoinService();
});

const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});
const btcSymbol = asNetworkSymbol('btc');
const testSymbol = asNetworkSymbol('test');
const regtestSymbol = asNetworkSymbol('regtest');
const ltcSymbol = asNetworkSymbol('ltc');

const rootReducer = combineReducers({
    suite: createReducer({}, () => ({})),
    tor: torReducer,
    discreetMode: createReducer({ isActive: false }, () => {}),
    locks: locksReducer,
    device: createReducer(
        { devices: [fixtures.DEVICE], selectedDevice: fixtures.DEVICE },
        () => ({}),
    ),
    modal: modalReducer,
    messageSystem: messageSystemReducer,
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
        accounts: prepareAccountsReducer({
            actionTypes: { storageLoad: mockActionType('storageLoad') },
            actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
            reducers: { storageLoadAccounts: mockReducer() },
        }),
        selectedAccount: selectedAccountReducer,
        settings: walletSettingsReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type Wallet = Partial<State['wallet']> & {
    device?: State['device'];
    suite?: State['suite'];
    locks?: Partial<State['locks']>;
};

const initStore = ({ accounts, coinjoin, device, selectedAccount, suite, locks }: Wallet = {}) => {
    // State != suite AppState, therefore <any>
    const store = createTestStore<void, any, UnknownAction>({
        extra: undefined,
        reducer: rootReducer,
        preloadedState: initPreloadedState({
            rootReducer,
            partialState: {
                suite,
                locks,
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
                expect(TrezorConnect.signTransaction.mock.calls[index]?.[0]).toMatchObject(params);
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
                    coinjoinServerEnvironment: { btc: 'public' },
                },
            },
        } as any); // partial required state

        const spy = jest.spyOn(CoinjoinService, 'createInstance');
        const cli1 = await store.dispatch(initCoinjoinService(btcSymbol));
        const cli2 = await store.dispatch(initCoinjoinService(btcSymbol));
        expect(cli1).toEqual(cli2);
        expect(spy.mock.calls[0]?.[0]).toMatchObject({
            symbol: 'btc',
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
        // eslint-disable-next-line jest/valid-expect-in-promise
        store.dispatch(initCoinjoinService(testSymbol)).then(cli3 => {
            expect(cli3?.client.settings.network).toEqual('test');
        });
        const cli3a = await store.dispatch(initCoinjoinService(testSymbol));
        expect(cli3a).toBe(undefined); // undefined because cli3 is not loaded yet
    });

    it('initCoinjoinService and throw error', async () => {
        const store = initStore();
        const cli = await store.dispatch(initCoinjoinService(ltcSymbol)); // ltc not supported
        expect(cli).toBe(undefined);
    });

    it('initCoinjoinService and errors to enable', async () => {
        const store = initStore();
        const spy = jest.spyOn(CoinjoinService, 'createInstance').mockImplementationOnce(
            () =>
                ({
                    client: {
                        enable: () => Promise.resolve({ success: false, error: 'Some error' }),
                    },
                }) as any,
        );
        const cli = await store.dispatch(initCoinjoinService(btcSymbol));
        expect(cli).toBe(undefined);
        spy.mockClear();
    });

    fixtures.clientEvents.forEach(f => {
        it(`CoinjoinClient events: ${f.description}`, async () => {
            const store = initStore(f.state as Wallet);

            const cli = await store.dispatch(initCoinjoinService(btcSymbol));
            cli?.client.emit(f.event as any, f.params);

            expect(store.getState().wallet.coinjoin).toMatchObject(f.result);
        });
    });

    it('setDebugSettings', () => {
        const store = initStore();
        expect(store.getState().wallet.coinjoin.debug).toBeUndefined();

        store.dispatch(setDebugSettings({ coinjoinServerEnvironment: { [testSymbol]: 'public' } }));

        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public' },
        });

        store.dispatch(
            setDebugSettings({ coinjoinServerEnvironment: { [regtestSymbol]: 'localhost' } }),
        );
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'public', regtest: 'localhost' },
        });

        store.dispatch(
            setDebugSettings({ coinjoinServerEnvironment: { [testSymbol]: 'staging' } }),
        );
        expect(store.getState().wallet.coinjoin.debug).toMatchObject({
            coinjoinServerEnvironment: { test: 'staging', regtest: 'localhost' },
        });
    });

    it('clientEmitException', async () => {
        const store = initStore();

        const cli1 = await store.dispatch(initCoinjoinService(btcSymbol));
        const cli2 = await store.dispatch(initCoinjoinService(testSymbol));

        if (!cli1 || !cli2) throw new Error('Client not initialized');

        store.dispatch(clientEmitException('Some exception'));

        expect(cli1.client.emit).toHaveBeenCalledTimes(1);
        expect(cli2.client.emit).toHaveBeenCalledTimes(1);
        expect(cli2.client.emit).toHaveBeenCalledWith('log', {
            level: 'error',
            payload: 'Some exception',
        });

        store.dispatch(clientEmitException('Other exception', { symbol: btcSymbol }));

        expect(cli1.client.emit).toHaveBeenCalledTimes(2);
        expect(cli2.client.emit).toHaveBeenCalledTimes(1);
    });

    it('clientEmitException from coinjoinMiddleware', async () => {
        const account = mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            accountType: 'coinjoin',
            descriptor: asAccountDescriptor('account1'),
            symbol: asNetworkSymbol('btc'),
        });

        const initializeStore = () =>
            initStore({
                accounts: [account],
                coinjoin: {
                    accounts: [
                        {
                            key: account.key,
                            symbol: 'btc',
                            session: { roundPhase: 1, signedRounds: [], maxRounds: 10 },
                        },
                    ],
                } as any,
            });

        const store = initializeStore();

        const cli = await store.dispatch(initCoinjoinService(btcSymbol));

        if (!cli) throw new Error('Client not initialized');

        store.dispatch({ type: '@suite/online-status', payload: false });
        expect(cli.client.emit).toHaveBeenCalledTimes(1);

        // restore session after previous action, and set phase to critical again
        // NOTE: dispatching torActions.setTorStatus('Enabled') requires a lot more fixtures
        const restoreSession = () => {
            store.dispatch({
                type: '@coinjoin/session-restore',
                payload: { accountKey: account.key },
            });
            store.dispatch({
                type: '@coinjoin/session-round-changed',
                payload: { accountKey: account.key, round: { phase: 1 } },
            });
        };

        restoreSession();
        store.dispatch(torActions.setTorStatus(TorStatus.Disabled));
        expect(cli.client.emit).toHaveBeenCalledTimes(2);

        restoreSession();
        store.dispatch({ type: 'device-disconnect', payload: { id: 'device-id' } });
        expect(cli.client.emit).toHaveBeenCalledTimes(3);

        // previous action stops the session
        const store2 = initializeStore();

        store2.dispatch({
            type: '@common/wallet-core/accounts/removeAccount',
            payload: [{ key: account.key }],
        });
        expect(cli.client.emit).toHaveBeenCalledTimes(4);
    });

    // for coverage: edge cases, missing data etc...
    it('pauseCoinjoinSession without related account', () => {
        const store = initStore();
        store.dispatch(pauseCoinjoinSession(mockAccountKey({ descriptor: 'accountZ' })));
    });

    it('stopCoinjoinSession without connected device', async () => {
        const accountAKey = mockAccountKey({ descriptor: 'accountA' });
        const store = initStore({
            accounts: [{ key: accountAKey, symbol: 'btc' }],
        } as any);

        testMocks.setTrezorConnectFixtures([{ success: false }]);

        await store.dispatch(initCoinjoinService(btcSymbol));

        store.dispatch(stopCoinjoinSession(accountAKey));
    });

    it('stopCoinjoinSession with error from Trezor', async () => {
        const accountAKey = mockAccountKey({ descriptor: 'accountA' });
        const store = initStore({
            accounts: [
                {
                    key: accountAKey,
                    symbol: 'btc',
                    deviceState: '1stTestnetAddress@device_id:0',
                },
            ],
        } as any);

        testMocks.setTrezorConnectFixtures([
            { success: false, error: { message: 'Firmware error' } },
        ]);

        await store.dispatch(initCoinjoinService(btcSymbol));

        store.dispatch(stopCoinjoinSession(accountAKey));

        expect(TrezorConnect.cancelCoinjoinAuthorization).toHaveBeenCalledTimes(1);
    });

    it('stopCoinjoinSession but not cancel authorization', async () => {
        const deviceBStaticSessionId: StaticSessionId = '1stTestnetAddress@device_b_id:0';
        const accountAKey = mockAccountKey({ descriptor: 'accountA' });
        const accountBKey = mockAccountKey({
            descriptor: 'accountB',
            deviceStaticSessionId: deviceBStaticSessionId,
        });
        const store = initStore({
            device: {
                devices: [
                    fixtures.DEVICE,
                    { ...fixtures.DEVICE, state: { staticSessionId: deviceBStaticSessionId } },
                ],
            },
            accounts: [
                {
                    key: accountAKey,
                    accountType: 'coinjoin',
                    symbol: 'btc',
                    deviceState: '1stTestnetAddress@device_id:0',
                },
                {
                    key: accountBKey,
                    accountType: 'coinjoin',
                    symbol: 'btc',
                    deviceState: deviceBStaticSessionId,
                },
            ],
            coinjoin: {
                accounts: [
                    { key: accountAKey, session: {} },
                    { key: accountBKey, session: {} },
                ],
            },
        } as any);

        await store.dispatch(initCoinjoinService(btcSymbol));

        store.dispatch(stopCoinjoinSession(accountAKey));

        expect(TrezorConnect.cancelCoinjoinAuthorization).toHaveBeenCalledTimes(0);
    });

    it('CoinjoinClient events', async () => {
        const store = initStore();
        const cli = await store.dispatch(initCoinjoinService(btcSymbol));

        // other requests are covered by fixtures.getOwnershipProof and fixtures.signCoinjoinTx
        cli?.client.emit('request', [{ type: 'unknown' } as any]);

        cli?.client.emit('log', { level: 'warn', payload: 'Warn' });
        cli?.client.emit('log', { level: 'error', payload: 'Error' });
    });
});
