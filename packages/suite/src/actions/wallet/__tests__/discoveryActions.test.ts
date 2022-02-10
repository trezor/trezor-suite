/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
// unit test for discovery actions
// data provided by TrezorConnect are mocked

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import accountsReducer from '@wallet-reducers/accountsReducer';
import discoveryReducer from '@wallet-reducers/discoveryReducer';
import walletSettingsReducer from '@wallet-reducers/settingsReducer';
import { NOTIFICATION } from '@suite-actions/constants';
import { DISCOVERY, ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { ArrayElement } from '@suite/types/utils';
import * as discoveryActions from '../discoveryActions';
import {
    paramsError,
    fixtures,
    interruptionFixtures,
    changeNetworksFixtures,
    unavailableCapabilities,
} from '../__fixtures__/discoveryActions';

const { getSuiteDevice } = global.JestMocks;

type Fixture = ArrayElement<typeof fixtures>;
type Bundle = { path: string; coin: string }[];

jest.mock('trezor-connect', () => {
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
                // @ts-ignore The operand of a 'delete' operator must be optional.
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
    suite: {
        device,
    },
    devices: [device],
    metadata: { enabled: false }, // don't use labeling in unit:tests
    wallet: {
        discovery: discoveryReducer(undefined, { type: 'foo' } as any),
        accounts: accountsReducer(undefined, { type: 'foo' } as any),
        settings: walletSettingsReducer(undefined, {
            type: WALLET_SETTINGS.CHANGE_NETWORKS,
            payload: ['btc', 'test'],
        }),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>([thunk]);

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
            // set fixtures in trezor-connect
            require('trezor-connect').setTestFixtures(f);
            const store = initStore(getInitialState(f.device));
            if (f.enabledNetworks) {
                store.dispatch({
                    type: WALLET_SETTINGS.CHANGE_NETWORKS,
                    payload: f.enabledNetworks,
                });
            }

            store.dispatch(discoveryActions.create('device-state', f.device || SUITE_DEVICE));
            await store.dispatch(discoveryActions.start());

            const result = store.getState().wallet.discovery[0];
            if (f.result) {
                expect(result.failed).toEqual(f.result.failed);
                expect(result.loaded).toEqual(result.total);
                expect(result.loaded).toEqual(store.getState().wallet.accounts.length);
                expect(result.bundleSize).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(NOTIFICATION.TOAST);
            }
        });
    });

    // Detailed info about this test could be found in fixtures
    interruptionFixtures.forEach(f => {
        it(`Start/stop/change networks/start: ${f.description}`, async done => {
            require('trezor-connect').setTestFixtures(f);
            const store = initStore();
            // additional action listener for triggering "discovery.stop" action
            store.subscribe(() => {
                const actions = store.getActions();
                const a = actions[actions.length - 1];
                if (a.type === ACCOUNT.CREATE) {
                    // call "stop" if added account is a trigger from fixtures
                    const trigger = f.trigger.find(t => a.payload.path.indexOf(t) >= 0);
                    if (trigger) {
                        store.dispatch(discoveryActions.stop());
                    }
                }
            });

            store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));

            // restart discovery until complete
            const loop = async (): Promise<any> => {
                await store.dispatch(discoveryActions.start());
                const lastAction = store.getActions().pop();
                if (lastAction.type === DISCOVERY.STOP) {
                    // since interruption is always called after account creation
                    // correct order for recent actions is: stop < update < interrupt (discoveryActions.handleProgress)
                    const update = store.getActions().pop();
                    const interrupt = store.getActions().pop();
                    expect(update.type).toEqual(DISCOVERY.UPDATE);
                    expect(interrupt.type).toEqual(DISCOVERY.INTERRUPT);
                    store.clearActions();
                    return loop();
                }
                return lastAction;
            };

            const complete = await loop();
            expect(complete.type).toEqual(DISCOVERY.COMPLETE);
            const discovery = store.getState().wallet.discovery[0];
            expect(discovery.loaded).toEqual(store.getState().wallet.accounts.length);
            done(expect(discovery.total).toEqual(discovery.loaded));
        });
    });

    changeNetworksFixtures.forEach(f => {
        it(`Change network: ${f.description}`, async done => {
            require('trezor-connect').setTestFixtures(f);
            const state = getInitialState();
            const store = initStore(state);
            // additional action listener for triggering "discovery.updateNetworkSettings" action
            store.subscribe(() => {
                const actions = store.getActions();
                const a = actions[actions.length - 1];
                if (a.type === ACCOUNT.CREATE) {
                    // call "updateNetworkSettings" if added account is a trigger from fixtures
                    const trigger = f.trigger.find(t => a.payload.path.indexOf(t.path) >= 0);
                    if (trigger) {
                        store.dispatch({
                            type: WALLET_SETTINGS.CHANGE_NETWORKS,
                            payload: trigger.networks,
                        });
                        store.dispatch(discoveryActions.updateNetworkSettings());
                    }
                }
            });

            store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
            await store.dispatch(discoveryActions.start());
            const complete = store.getActions().pop();
            expect(complete.type).toEqual(DISCOVERY.COMPLETE);
            const discovery = store.getState().wallet.discovery[0];
            const accounts = store
                .getState()
                .wallet.accounts.filter(a => discovery.networks.includes(a.symbol));

            // length of accounts in reducer are equal discovery.loaded
            expect(discovery.loaded).toEqual(accounts.length);
            // 100% progress
            done(expect(discovery.total).toEqual(discovery.loaded));
        });
    });

    unavailableCapabilities.forEach(f => {
        it(`Change network: ${f.description}`, () => {
            const state = getInitialState();
            if (f.device) {
                state.suite.device = f.device;
                state.devices = [f.device];
            }
            const store = initStore(state);
            store.dispatch(discoveryActions.create('device-state', f.device || SUITE_DEVICE));
            store.dispatch({
                type: WALLET_SETTINGS.CHANGE_NETWORKS,
                payload: f.networks,
            });
            store.dispatch(discoveryActions.updateNetworkSettings());

            const discovery = store.getState().wallet.discovery[0];
            expect(discovery.networks).toEqual(f.discoveryNetworks);
        });
    });

    it('Start discovery without device', async () => {
        const state = {
            suite: {},
            wallet: {
                accounts: [],
                discovery: [],
                settings: {
                    cardanoDerivationType: {
                        label: 'Icarus',
                        value: 1,
                    },
                    enabledNetworks: ['btc'],
                },
            },
        };
        // @ts-ignore: invalid state (suite empty)
        const store = initStore(state);
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.TOAST);
    });

    it('Start discovery with device without auth confirmation', async () => {
        const state = getInitialState();
        state.suite.device = getSuiteDevice({ authConfirm: true });
        // @ts-ignore: invalid state (suite empty)
        const store = initStore(state);
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.TOAST);
    });

    it('Create discovery which already exist', () => {
        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        expect(store.getState().wallet.discovery.length).toEqual(1);
    });

    it('Start discovery which does not exist (discoveryActions test)', async () => {
        const store = initStore();
        await store.dispatch(discoveryActions.start());
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Start discovery which does not exist (discoveryReducer test)', () => {
        const store = initStore();
        store.dispatch({
            type: DISCOVERY.START,
            payload: SUITE_DEVICE,
        });
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Update discovery which does not exist', () => {
        const store = initStore();
        store.dispatch(discoveryActions.update({ deviceState: 'not-existed' }));
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Start/stop', done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('discovery_interrupted')), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);
        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        store.dispatch(discoveryActions.start()).then(() => {
            const action = store.getActions().pop();
            done(expect(action.type).toEqual(DISCOVERY.STOP));
        });
        store.dispatch(discoveryActions.stop());
    });

    it('Stop discovery without device (discovery not exists)', async () => {
        const state = {
            suite: {},
            wallet: {
                accounts: [],
                discovery: [],
            },
        };
        // @ts-ignore: invalid state (suite empty)
        const store = initStore(state);
        await store.dispatch(discoveryActions.stop());
        expect(store.getActions()).toEqual([]);
    });

    it('Restart discovery (clear failed fields)', async () => {
        // fail on first account
        require('trezor-connect').setTestFixtures({
            connect: { success: true, failedAccounts: ["m/84'/0'/0'"] },
        });
        const state = getInitialState();
        const store = initStore(state);
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        // there should be one failed account
        expect(store.getActions().pop().type).toEqual(DISCOVERY.COMPLETE);
        expect(store.getState().wallet.discovery[0].failed.length).toBeGreaterThan(0);

        // change fixtures, this time no fail
        require('trezor-connect').setTestFixtures({
            connect: { success: true },
        });
        // restart
        await store.dispatch(discoveryActions.restart());
        // discovery completed, no failed account
        expect(store.getActions().pop().type).toEqual(DISCOVERY.COMPLETE);
        expect(store.getState().wallet.discovery[0].failed.length).toEqual(0);
        // remove discovery
        store.dispatch(discoveryActions.remove('device-state'));
        // restart (discovery doesn't exists)
        await store.dispatch(discoveryActions.restart());
    });

    it(`TrezorConnect responded with success but discovery was removed`, async done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = initStore();
        store.subscribe(() => {
            const actions = store.getActions();
            const a = actions[actions.length - 1];
            if (a.type === DISCOVERY.UPDATE && a.payload.status === 1) {
                // catch bundle update called from 'start()' and remove discovery before TrezorConnect response
                store.dispatch(discoveryActions.remove('device-state'));
            }
        });
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        done(expect(action.type).toEqual(DISCOVERY.REMOVE));
    });

    it(`TrezorConnect responded with success but discovery is not running`, async done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = initStore();
        store.subscribe(() => {
            const actions = store.getActions();
            const a = actions[actions.length - 1];
            if (a.type === DISCOVERY.UPDATE && a.payload.status === 1) {
                // catch bundle update called from 'start()' and stop discovery before TrezorConnect response
                store.dispatch(
                    discoveryActions.update({
                        deviceState: 'device-state',
                        status: DISCOVERY.STATUS.STOPPED,
                    }),
                );
            }
        });
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        done(expect(action.type).toEqual(NOTIFICATION.TOAST));
    });

    it('Discovery completed but device is not connected anymore', async () => {
        require('trezor-connect').setTestFixtures({
            connect: { success: true },
        });
        const mockedGetFeatures = jest.spyOn(require('trezor-connect').default, 'getFeatures');
        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        // "disconnect" device
        store.getState().suite.device.connected = false;
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(DISCOVERY.COMPLETE);
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
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.TOAST);
    });

    it('First iteration malformed error (invalid json not an array)', async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('{}', 'Method_Discovery_BundleException')), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.TOAST);
    });

    it('TrezorConnect did not emit any progress event', async () => {
        // store original mocked function
        const originalFn = require('trezor-connect').default.getAccountInfo;
        // set fixtures in trezor-connect
        require('trezor-connect').default.getAccountInfo = () => ({
            success: true,
        });
        const store = initStore();
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        // restore original mocked fn
        require('trezor-connect').default.getAccountInfo = originalFn;
        const result = store.getState().wallet.discovery[0];
        expect(action.type).toEqual(DISCOVERY.COMPLETE);
        expect(result.loaded).toEqual(0);
    });

    it('All accounts failed in runtime', async () => {
        // store original mocked function
        const originalFn = require('trezor-connect').default.getAccountInfo;
        // override mocked function
        require('trezor-connect').default.getAccountInfo = (params: { bundle: Bundle }) => {
            // prepare response (all failed)
            const failedAccounts: string[] = [];
            for (let i = 0; i < params.bundle.length; i++) {
                failedAccounts.push(params.bundle[i].path);
            }
            require('trezor-connect').setTestFixtures({
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
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        // restore original mocked fn
        require('trezor-connect').default.getAccountInfo = originalFn;
        const action = store.getActions().pop();
        const result = store.getState().wallet.discovery[0];
        expect(action.type).toEqual(DISCOVERY.COMPLETE);
        expect(result.loaded).toEqual(0);
        expect(result.total).toEqual(0);
    });

    it('All accounts failed in first iteration', async () => {
        // store original mocked function
        const originalFn = require('trezor-connect').default.getAccountInfo;
        // override mocked function
        require('trezor-connect').default.getAccountInfo = (params: { bundle: Bundle }) => {
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
        store.dispatch(discoveryActions.create('device-state', SUITE_DEVICE));
        await store.dispatch(discoveryActions.start());
        // restore original mocked fn
        require('trezor-connect').default.getAccountInfo = originalFn;
        const action = store.getActions().pop();
        const result = store.getState().wallet.discovery[0];
        expect(action.type).toEqual(DISCOVERY.COMPLETE);
        expect(result.loaded).toEqual(0);
        expect(result.total).toEqual(0);
    });

    it('getDiscoveryAuthConfirmationStatus', async () => {
        require('trezor-connect').setTestFixtures({
            connect: { success: true },
        });
        const state = getInitialState();
        state.suite.device = getSuiteDevice({
            state: 'device-state',
            connected: true,
            useEmptyPassphrase: false, // mandatory
        });
        const store = initStore(state);
        const fn = discoveryActions.getDiscoveryAuthConfirmationStatus;

        store.dispatch(discoveryActions.create('device-state', state.suite.device));
        await store.dispatch(discoveryActions.start());
        expect(store.dispatch(fn())).toEqual(true);

        // remove discovery
        store.dispatch(discoveryActions.remove('device-state'));
        expect(store.dispatch(fn())).toEqual(undefined);

        // @ts-ignore remove device from state
        store.getState().suite.device = undefined;
        expect(store.dispatch(fn())).toEqual(undefined);
    });
});
