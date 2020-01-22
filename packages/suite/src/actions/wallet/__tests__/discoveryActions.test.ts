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
} from '../__fixtures__/discoveryActions';

const { getSuiteDevice } = global.JestMocks;

type Fixture = ArrayElement<typeof fixtures>;
type Bundle = { path: string; coin: string }[];

jest.mock('trezor-connect', () => {
    let progressCallback: Function = () => {};
    let fixture: Fixture | Promise<Fixture> | Function | typeof undefined;

    // mocked function
    const getAccountInfo = async (params: { bundle: Bundle }) => {
        // this error applies only for tests
        if (typeof fixture === 'undefined') {
            return paramsError('Default error. Fixtures not set');
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
                delete connect.error; // reset this value, it shouldn't be used in next iteration
                return paramsError(error, code);
            }
            return paramsError(error);
        }

        // emit BUNDLE_PROGRESS
        for (let i = 0; i < params.bundle.length; i++) {
            const param = params.bundle[i];
            const accountType = param.path
                .split('/')
                .slice(0, 3)
                .join('/');
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

        return paramsError('Fixture response not defined');
    };

    return {
        __esModule: true, // this property makes it work
        default: {
            getFeatures: () => {},
            off: () => {
                progressCallback = () => {};
            },
            on: (_event: string, cb: Function) => {
                progressCallback = cb;
            },
            getAccountInfo,
            cancel: () => {},
        },
        UI: {
            BUNDLE_PROGRESS: 'progress',
        },
        setTestFixtures: (f: Fixture) => {
            fixture = f;
        },
    };
});

const SUITE_DEVICE = getSuiteDevice({ state: 'device-state', connected: true });
export const getInitialState = () => ({
    suite: {
        device: SUITE_DEVICE,
    },
    wallet: {
        discovery: discoveryReducer(undefined, { type: 'foo' } as any),
        accounts: accountsReducer(undefined, { type: 'foo' } as any),
        settings: walletSettingsReducer(undefined, {
            type: WALLET_SETTINGS.CHANGE_NETWORKS,
            payload: ['btc', 'test'],
        }),
    },
});

const mockStore = configureStore<ReturnType<typeof getInitialState>, any>([thunk]);

const updateStore = (store: ReturnType<typeof mockStore>) => {
    // there is not much redux logic in this test
    // just update state on every action manually
    const action = store.getActions().pop();
    const { accounts, discovery, settings } = store.getState().wallet;

    store.getState().wallet = {
        accounts: accountsReducer(accounts, action),
        discovery: discoveryReducer(discovery, action),
        settings: walletSettingsReducer(settings, action),
    };
    // add action back to stack
    store.getActions().push(action);
};

describe('Discovery Actions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            // set fixtures in trezor-connect
            require('trezor-connect').setTestFixtures(f);

            const state = getInitialState();
            const store = mockStore(state);
            store.subscribe(() => updateStore(store));

            store.dispatch(discoveryActions.create('device-state'));
            await store.dispatch(discoveryActions.start());
            await store.dispatch(discoveryActions.start());

            const result = store.getState().wallet.discovery[0];
            if (f.result) {
                expect(result.failed).toEqual(f.result.failed);
                expect(result.loaded).toEqual(result.total);
                expect(result.loaded).toEqual(store.getState().wallet.accounts.length);
                expect(result.bundleSize).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(NOTIFICATION.ADD);
            }
        });
    });

    // Detailed info about this test could be found in fixtures
    interruptionFixtures.forEach(f => {
        it(`Start/stop/restart: ${f.description}`, async done => {
            require('trezor-connect').setTestFixtures(f);
            const store = mockStore(getInitialState());
            store.subscribe(() => updateStore(store));
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

            store.dispatch(discoveryActions.create('device-state'));

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
            const store = mockStore(getInitialState());
            store.subscribe(() => updateStore(store));
            // additional action listener for triggering "discovery.stop" action
            store.subscribe(() => {
                const actions = store.getActions();
                const a = actions[actions.length - 1];
                if (a.type === ACCOUNT.CREATE) {
                    // call "stop" if added account is a trigger from fixtures
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

            store.dispatch(discoveryActions.create('device-state'));
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

    it('Start discovery without device', async () => {
        // @ts-ignore: invalid state (suite empty)
        const store = mockStore({
            suite: {},
            wallet: {
                accounts: [],
                discovery: [],
            },
        });
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.ADD);
    });

    it('Create discovery which already exist', async () => {
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        store.dispatch(discoveryActions.create('device-state'));
        expect(store.getState().wallet.discovery.length).toEqual(1);
    });

    it('Start discovery which does not exist', async () => {
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch({
            type: DISCOVERY.START,
            payload: SUITE_DEVICE,
        });
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Update discovery which does not exist', async () => {
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch({
            type: DISCOVERY.UPDATE,
            payload: SUITE_DEVICE,
        });
        expect(store.getState().wallet.discovery.length).toEqual(0);
    });

    it('Start/stop', async done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('discovery_interrupted')), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        store.dispatch(discoveryActions.start()).then(() => {
            const action = store.getActions().pop();
            done(expect(action.type).toEqual(DISCOVERY.STOP));
        });
        store.dispatch(discoveryActions.stop());
    });

    it('Stop discovery without device (discovery not exists)', async () => {
        // @ts-ignore: invalid state (suite empty)
        const store = mockStore({
            suite: {},
            wallet: {
                accounts: [],
                discovery: [],
            },
        });
        await store.dispatch(discoveryActions.stop());
        expect(store.getActions()).toEqual([]);
    });

    it(`TrezorConnect responded with success but discovery was removed`, async done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        store.dispatch(discoveryActions.start()).then(() => {
            const action = store.getActions().pop();
            done(expect(action.type).toEqual(DISCOVERY.REMOVE));
        });
        store.dispatch(discoveryActions.remove('device-state'));
    });

    it(`TrezorConnect responded with success but discovery is not running`, async done => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        store.dispatch(discoveryActions.start()).then(() => {
            const action = store.getActions().pop();
            done(expect(action.type).toEqual(NOTIFICATION.ADD));
        });
        store.dispatch(
            discoveryActions.update({
                deviceState: 'device-state',
                status: DISCOVERY.STATUS.STOPPED,
            }),
        );
    });

    it('First iteration malformed error (not a json)', async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('not-a-json', 'bundle_fw_exception')), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.ADD);
    });

    it('First iteration malformed error (invalid json not an array)', async () => {
        const f = new Promise(resolve => {
            setTimeout(() => resolve(paramsError('{}', 'bundle_fw_exception')), 100);
        });
        // set fixtures in trezor-connect
        require('trezor-connect').setTestFixtures(f);

        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        expect(action.type).toEqual(NOTIFICATION.ADD);
    });

    it('TrezorConnect did not emit any progress event', async () => {
        // store original mocked function
        const originalFn = require('trezor-connect').default.getAccountInfo;
        // set fixtures in trezor-connect
        require('trezor-connect').default.getAccountInfo = () => ({
            success: true,
        });
        const store = mockStore(getInitialState());
        store.dispatch(discoveryActions.create('device-state'));
        await store.dispatch(discoveryActions.start());
        const action = store.getActions().pop();
        // restore original mocked fn
        require('trezor-connect').default.getAccountInfo = originalFn;
        expect(action.type).toEqual(NOTIFICATION.ADD);
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
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
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
            return paramsError(JSON.stringify(failedAccounts), 'bundle_fw_exception');
        };
        // run process
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state'));
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
        const store = mockStore(getInitialState());
        store.subscribe(() => updateStore(store));
        store.dispatch(discoveryActions.create('device-state', false));
        await store.dispatch(discoveryActions.start());
        const status = store.dispatch(discoveryActions.getDiscoveryAuthConfirmationStatus());
        expect(status).toEqual(true);
    });
});
