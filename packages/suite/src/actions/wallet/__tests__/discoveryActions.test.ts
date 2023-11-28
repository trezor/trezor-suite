/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
// unit test for discovery actions
// data provided by TrezorConnect are mocked

import {
    prepareDiscoveryReducer,
    accountsActions,
    createDiscoveryThunk,
    restartDiscoveryThunk,
    startDiscoveryThunk,
    stopDiscoveryThunk,
    updateNetworkSettingsThunk,
    selectIsDiscoveryAuthConfirmationRequired,
} from '@suite-common/wallet-core';
import { ArrayElement } from '@trezor/type-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import * as discoveryActions from '@suite-common/wallet-core';

import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import walletSettingsReducer from 'src/reducers/wallet/settingsReducer';
import { accountsReducer } from 'src/reducers/wallet';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { extraDependencies } from 'src/support/extraDependencies';

import {
    paramsError,
    fixtures,
    interruptionFixtures,
    changeNetworksFixtures,
    unavailableCapabilities,
} from '../__fixtures__/discoveryActions';

const discoveryReducer = prepareDiscoveryReducer(extraDependencies);

const { getSuiteDevice } = testMocks;

type Fixture = ArrayElement<typeof fixtures>;
type Bundle = { path: string; coin: string }[];

jest.mock('@trezor/connect', () => {
    let progressCallback = (_e: any): any => {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    let fixture: Fixture | Promise<Fixture> | Function | typeof undefined;

    // The module factory of `jest.mock()` is not allowed to reference any out-of-scope variables.
    const scopedParamsError = (error: string, code?: string) => ({
        success: false,
        payload: {
            error,
            code,
        },
    });

    // mocked function
    // eslint-disable-next-line require-await
    const getAccountInfo = async (params: { bundle: Bundle }) => {
        // this error applies only for tests
        if (typeof fixture === 'undefined') {
            return scopedParamsError('Default error. Fixtures not set');
        }
        // this promise will be resolved by TrezorConnect.cancel
        if (fixture instanceof Promise) {
            return fixture;
        }

        if (typeof fixture === 'function') {
            return fixture.call(null, progressCallback);
        }

        const { connect } = fixture;
        if (connect.error) {
            // error code is used in case where one of requested coins is not supported
            const { code, error } = connect.error;
            if (code) {
                // @ts-expect-error The operand of a 'delete' operator must be optional.
                delete connect.error; // reset this value, it shouldn't be used in next iteration
                return scopedParamsError(error, code);
            }
            return scopedParamsError(error);
        }

        // emit BUNDLE_PROGRESS
        for (let i = 0; i < params.bundle.length; i++) {
            const param = params.bundle[i];
            const accountType = param.path.split('/').slice(0, 3).join('/');
            let isEmpty = true;
            let isFailed = false;

            if (connect.interruption) {
                const interrupted = connect.interruption.indexOf(param.path);
                if (interrupted >= 0) {
                    connect.interruption[interrupted] = 'interruption-item-used';
                    return {
                        success: false,
                        payload: {
                            error: 'discovery_interrupted',
                        },
                    };
                }
            }

            if (connect.usedAccounts) {
                connect.usedAccounts.some(a => {
                    const found = a.indexOf(accountType) >= 0;
                    if (found && param.path !== a) {
                        isEmpty = false;
                        return true;
                    }
                    return false;
                });
            }

            if (connect.failedAccounts) {
                connect.failedAccounts.some(a => {
                    const found = a.indexOf(accountType) >= 0;
                    if (found && param.path === a) {
                        isFailed = true;
                        return true;
                    }
                    return false;
                });
            }

            if (isFailed) {
                progressCallback.call(null, {
                    progress: i,
                    response: null,
                    error: 'Runtime discovery error',
                });
            } else {
                progressCallback.call(null, {
                    progress: i,
                    response: {
                        descriptor: param.path,
                        empty: isEmpty,
                        history: {},
                    },
                    error: null,
                });
            }
        }

        if (connect.success) {
            return {
                success: true,
            };
        }

        return scopedParamsError('Fixture response not defined');
    };

    return {
        ...jest.requireActual('@trezor/connect'),
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            getFeatures: () => {},
            cipherKeyValue: () => {},
            off: () => {
                progressCallback = () => {};
            },
            on: (_event: string, cb: () => any) => {
                progressCallback = cb;
            },
            getAccountInfo,
            cancel: () => {},
        },
        BLOCKCHAIN: {},
        UI: {
            BUNDLE_PROGRESS: 'progress',
        },
        setTestFixtures: (f: Fixture) => {
            fixture = f;
        },
    };
});

const SUITE_DEVICE = getSuiteDevice({ state: 'device-state', connected: true });
export const getInitialState = (device = SUITE_DEVICE) => ({
    device: {
        devices: [device],
        selectedDevice: device,
    },
    metadata: { enabled: false, providers: [] }, // don't use labeling in unit:tests
    wallet: {
        discovery: discoveryReducer(undefined, { type: 'foo' } as any),
        accounts: accountsReducer(undefined, { type: 'foo' } as any),
        settings: walletSettingsReducer(undefined, {
            type: walletSettingsActions.changeNetworks.type,
            payload: ['btc', 'test'],
        }),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State = getInitialState()) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { accounts, discovery, settings } = store.getState().wallet;
        store.getState().wallet = {
            accounts: accountsReducer(accounts, action),
            discovery: discoveryReducer(discovery, action),
            settings: walletSettingsReducer(settings, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Discovery Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            // set fixtures in @trezor/connect
            require('@trezor/connect').setTestFixtures(f);
            const store = initStore(getInitialState(f.device));
            if (f.enabledNetworks) {
                store.dispatch(
                    walletSettingsActions.changeNetworks(f.enabledNetworks as NetworkSymbol[]),
                );
            }

            store.dispatch(
                createDiscoveryThunk({
                    deviceState: 'device-state',
                    device: f.device || SUITE_DEVICE,
                }),
            );
            await store.dispatch(startDiscoveryThunk());

            const result = store.getState().wallet.discovery[0];
            if (f.result) {
                expect(result.failed).toEqual(f.result.failed);
                expect(result.loaded).toEqual(result.total);
                expect(result.loaded).toEqual(store.getState().wallet.accounts.length);
                expect(result.bundleSize).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.type).toEqual(notificationsActions.addToast.type);
            }
        });
    });

    // Detailed info about this test could be found in fixtures
    interruptionFixtures.forEach(f => {
        it(`Start/stop/change networks/start: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f);
            const store = initStore();
            // additional action listener for triggering "discovery.stop" action
            store.subscribe(() => {
                const actions = store.getActions();
                const a = actions[actions.length - 1];
                if (accountsActions.createAccount.match(a)) {
                    // call "stop" if added account is a trigger from fixtures
                    const trigger = f.trigger.find(t => a.payload.path.indexOf(t) >= 0);
                    if (trigger) {
                        store.dispatch(stopDiscoveryThunk());
                    }
                }
            });

            store.dispatch(
                createDiscoveryThunk({
                    deviceState: 'device-state',
                    device: SUITE_DEVICE,
                }),
            );

            // restart discovery until complete
            const loop = async (): Promise<any> => {
                await store.dispatch(startDiscoveryThunk());
                const actions = filterThunkActionTypes(store.getActions());
                const lastAction = actions.pop();
                if (lastAction?.type === discoveryActions.stopDiscovery.type) {
                    // since interruption is always called after account creation
                    // correct order for recent actions is: stop < update < interrupt (discoveryActions.handleProgress)
                    const update = actions.pop();
                    const interrupt = actions.pop();
                    expect(update?.type).toEqual(discoveryActions.updateDiscovery.type);
                    expect(interrupt?.type).toEqual(discoveryActions.interruptDiscovery.type);
                    store.clearActions();
                    return loop();
                }
                return lastAction;
            };

            const complete = await loop();
            expect(complete.type).toEqual(discoveryActions.completeDiscovery.type);
            const discovery = store.getState().wallet.discovery[0];
            expect(discovery.loaded).toEqual(store.getState().wallet.accounts.length);
            expect(discovery.total).toEqual(discovery.loaded);
        });
    });

    changeNetworksFixtures.forEach(f => {
        it(`Change network: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f);
            const state = getInitialState();
            const store = initStore(state);
            // additional action listener for triggering "discovery.updateNetworkSettings" action
            store.subscribe(() => {
                const actions = store.getActions();
                const a = actions[actions.length - 1];
                if (accountsActions.createAccount.match(a)) {
                    // call "updateNetworkSettings" if added account is a trigger from fixtures
                    const trigger = f.trigger.find(t => a.payload.path.indexOf(t.path) >= 0);
                    if (trigger) {
                        store.dispatch(
                            walletSettingsActions.changeNetworks(
                                trigger.networks as NetworkSymbol[],
                            ),
                        );
                        store.dispatch(updateNetworkSettingsThunk());
                    }
                }
            });

            store.dispatch(
                createDiscoveryThunk({
                    deviceState: 'device-state',
                    device: SUITE_DEVICE,
                }),
            );
            await store.dispatch(startDiscoveryThunk());
            const complete = filterThunkActionTypes(store.getActions()).pop();
            expect(complete?.type).toEqual(discoveryActions.completeDiscovery.type);
            const discovery = store.getState().wallet.discovery[0];
            const accounts = store
                .getState()
                .wallet.accounts.filter(a => discovery.networks.includes(a.symbol));

            // length of accounts in reducer are equal discovery.loaded
            expect(discovery.loaded).toEqual(accounts.length);
            // 100% progress
            expect(discovery.total).toEqual(discovery.loaded);
        });
    });

    unavailableCapabilities.forEach(f => {
        it(`Change network: ${f.description}`, () => {
            const state = getInitialState();
            if (f.device) {
                state.device.selectedDevice = f.device;
                state.device.devices = [f.device];
            }
            const store = initStore(state);
            store.dispatch(
                createDiscoveryThunk({
                    deviceState: 'device-state',
                    device: f.device || SUITE_DEVICE,
                }),
            );
            store.dispatch(walletSettingsActions.changeNetworks(f.networks as NetworkSymbol[]));
            store.dispatch(updateNetworkSettingsThunk());

            const discovery = store.getState().wallet.discovery[0];
            expect(discovery.networks).toEqual(f.discoveryNetworks);
        });
    });

    it('Start discovery without device', async () => {
        const state = {
            suite: {},
            device: {},
            wallet: {
                accounts: [],
                discovery: [],
                settings: {
                    enabledNetworks: ['btc'],
                },
            },
        };
        // @ts-expect-error: invalid state (suite empty)
        const store = initStore(state);
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(notificationsActions.addToast.type);
    });

    it('Start discovery with device without auth confirmation', async () => {
        const state = getInitialState();
        state.device.selectedDevice = getSuiteDevice({ authConfirm: true });
        const store = initStore(state);
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(notificationsActions.addToast.type);
    });

    it('Create discovery which already exist', () => {
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        expect(store.getState().wallet.discovery.length).toEqual(1);
    });

    it('Start discovery which does not exist (discoveryActions test)', async () => {
        const store = initStore();
        await store.dispatch(startDiscoveryThunk());
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Start discovery which does not exist (discoveryReducer test)', () => {
        const store = initStore();
        store.dispatch({
            type: discoveryActions.startDiscovery.type,
            payload: SUITE_DEVICE,
        });
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Update discovery which does not exist', () => {
        const store = initStore();
        store.dispatch(discoveryActions.updateDiscovery({ deviceState: 'not-existed' }));
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Start/stop', done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('discovery_interrupted')), 100);
        });
        // set fixtures in @trezor/connect
        require('@trezor/connect').setTestFixtures(f);
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        store.dispatch(startDiscoveryThunk()).then(() => {
            const action = filterThunkActionTypes(store.getActions()).pop();
            done(expect(action?.type).toEqual(discoveryActions.stopDiscovery.type));
        });
        store.dispatch(stopDiscoveryThunk());
    });

    it('Stop discovery without device (discovery not exists)', async () => {
        const state = {
            suite: {},
            device: {},
            wallet: {
                accounts: [],
                discovery: [],
            },
        };
        // @ts-expect-error: invalid state (suite empty)
        const store = initStore(state);
        await store.dispatch(stopDiscoveryThunk());
        expect(filterThunkActionTypes(store.getActions())).toEqual([]);
    });

    it('Restart discovery (clear failed fields)', async () => {
        // fail on first account
        require('@trezor/connect').setTestFixtures({
            connect: { success: true, failedAccounts: ["m/84'/0'/0'"] },
        });
        const state = getInitialState();
        const store = initStore(state);
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        // there should be one failed account
        expect(filterThunkActionTypes(store.getActions()).pop()?.type).toEqual(
            discoveryActions.completeDiscovery.type,
        );
        expect(store.getState().wallet.discovery[0].failed.length).toBeGreaterThan(0);

        // change fixtures, this time no fail
        require('@trezor/connect').setTestFixtures({
            connect: { success: true },
        });
        // restart
        await store.dispatch(restartDiscoveryThunk());
        // discovery completed, no failed account
        expect(filterThunkActionTypes(store.getActions()).pop()?.type).toEqual(
            discoveryActions.completeDiscovery.type,
        );
        expect(store.getState().wallet.discovery[0].failed.length).toEqual(0);
        // remove discovery
        store.dispatch(discoveryActions.removeDiscovery('device-state'));
        // restart (discovery doesn't exists)
        await store.dispatch(restartDiscoveryThunk());
    });

    it(`TrezorConnect responded with success but discovery was removed`, async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in @trezor/connect
        require('@trezor/connect').setTestFixtures(f);

        const store = initStore();
        store.subscribe(() => {
            const actions = store.getActions();
            const a = actions[actions.length - 1];
            if (a.type === discoveryActions.updateDiscovery.type && a.payload.status === 1) {
                // catch bundle update called from 'start()' and remove discovery before TrezorConnect response
                store.dispatch(discoveryActions.removeDiscovery('device-state'));
            }
        });
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(discoveryActions.removeDiscovery.type);
    });

    it(`TrezorConnect responded with success but discovery is not running`, async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in @trezor/connect
        require('@trezor/connect').setTestFixtures(f);

        const store = initStore();
        store.subscribe(() => {
            const actions = filterThunkActionTypes(store.getActions());
            const a = actions[actions.length - 1];
            if (a.type === discoveryActions.updateDiscovery.type && a.payload.status === 1) {
                // catch bundle update called from 'start()' and stop discovery before TrezorConnect response
                store.dispatch(
                    discoveryActions.updateDiscovery({
                        deviceState: 'device-state',
                        status: DiscoveryStatus.STOPPED,
                    }),
                );
            }
        });
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions())?.pop();
        expect(action?.type).toEqual(notificationsActions.addToast.type);
    });

    it('Discovery completed but device is not connected anymore', async () => {
        require('@trezor/connect').setTestFixtures({
            connect: { success: true },
        });
        const mockedGetFeatures = jest.spyOn(require('@trezor/connect').default, 'getFeatures');
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        // "disconnect" device
        store.getState().device.selectedDevice.connected = false;
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(discoveryActions.completeDiscovery.type);
        // getFeatures shouldn't be called
        expect(mockedGetFeatures).toHaveBeenCalledTimes(0);
    });

    it('First iteration malformed error (not a json)', async () => {
        const f = new Promise(resolve => {
            setTimeout(
                () => resolve(paramsError('not-a-json', 'Method_Discovery_BundleException')),
                100,
            );
        });
        // set fixtures in @trezor/connect
        require('@trezor/connect').setTestFixtures(f);

        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(notificationsActions.addToast.type);
    });

    it('First iteration malformed error (invalid json not an array)', async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('{}', 'Method_Discovery_BundleException')), 100);
        });
        // set fixtures in @trezor/connect
        require('@trezor/connect').setTestFixtures(f);

        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        expect(action?.type).toEqual(notificationsActions.addToast.type);
    });

    it('TrezorConnect did not emit any progress event', async () => {
        // store original mocked function
        const originalFn = require('@trezor/connect').default.getAccountInfo;
        // set fixtures in @trezor/connect
        require('@trezor/connect').default.getAccountInfo = () => ({
            success: true,
        });
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        const action = filterThunkActionTypes(store.getActions()).pop();
        // restore original mocked fn
        require('@trezor/connect').default.getAccountInfo = originalFn;
        const result = store.getState().wallet.discovery[0];
        expect(action?.type).toEqual(discoveryActions.completeDiscovery.type);
        expect(result.loaded).toEqual(0);
    });

    it('All accounts failed in runtime', async () => {
        // store original mocked function
        const originalFn = require('@trezor/connect').default.getAccountInfo;
        // override mocked function
        require('@trezor/connect').default.getAccountInfo = (params: { bundle: Bundle }) => {
            // prepare response (all failed)
            const failedAccounts: string[] = [];
            for (let i = 0; i < params.bundle.length; i++) {
                failedAccounts.push(params.bundle[i].path);
            }
            require('@trezor/connect').setTestFixtures({
                connect: {
                    success: true,
                    failedAccounts,
                },
            });
            // call original mocked fn
            return originalFn(params);
        };
        // run process
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        // restore original mocked fn
        require('@trezor/connect').default.getAccountInfo = originalFn;
        const action = filterThunkActionTypes(store.getActions()).pop();
        const result = store.getState().wallet.discovery[0];
        expect(action?.type).toEqual(discoveryActions.completeDiscovery.type);
        expect(result.loaded).toEqual(0);
        expect(result.total).toEqual(0);
    });

    it('All accounts failed in first iteration', async () => {
        // store original mocked function
        const originalFn = require('@trezor/connect').default.getAccountInfo;
        // override mocked function
        require('@trezor/connect').default.getAccountInfo = (params: { bundle: Bundle }) => {
            // prepare json response
            const failedAccounts: any[] = [];
            for (let i = 0; i < params.bundle.length; i++) {
                failedAccounts.push({
                    index: i,
                    coin: params.bundle[i].coin,
                    exception: 'not supported',
                });
            }
            // return error
            return paramsError(JSON.stringify(failedAccounts), 'Method_Discovery_BundleException');
        };
        // run process
        const store = initStore();
        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: SUITE_DEVICE,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        // restore original mocked fn
        require('@trezor/connect').default.getAccountInfo = originalFn;
        const action = filterThunkActionTypes(store.getActions()).pop();
        const result = store.getState().wallet.discovery[0];
        expect(action?.type).toEqual(discoveryActions.completeDiscovery.type);
        expect(result.loaded).toEqual(0);
        expect(result.total).toEqual(0);
    });

    it('selectIsDiscoveryAuthConfirmationRequired', async () => {
        require('@trezor/connect').setTestFixtures({
            connect: { success: true },
        });
        const state = getInitialState();
        state.device.selectedDevice = getSuiteDevice({
            state: 'device-state',
            connected: true,
            useEmptyPassphrase: false, // mandatory
        });
        const store = initStore(state);

        // Necessary workaround, as redux-mock-store, as we use it, doesn't have immutable state.
        // TODO: We should use configureMockStore from @suite-common/test-utils here
        const fn = (state: any) => selectIsDiscoveryAuthConfirmationRequired({ ...state });

        store.dispatch(
            createDiscoveryThunk({
                deviceState: 'device-state',
                device: state.device.selectedDevice,
            }),
        );
        await store.dispatch(startDiscoveryThunk());
        expect(fn(store.getState())).toEqual(true);

        // remove discovery
        store.dispatch(discoveryActions.removeDiscovery('device-state'));
        expect(fn(store.getState())).toEqual(undefined);

        // @ts-expect-error remove device from state
        store.getState().device.device = undefined;
        expect(fn(store.getState())).toEqual(undefined);
    });
});
