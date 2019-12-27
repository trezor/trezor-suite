/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable global-require */
// unit test for suite actions
// data provided by TrezorConnect are mocked

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DEVICE } from 'trezor-connect';
import suiteReducer from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import routerReducer from '@suite-reducers/routerReducer';
import modalReducer from '@suite-reducers/modalReducer';
import { SUITE } from '../constants';
import * as suiteActions from '../suiteActions';
import { init } from '../trezorConnectActions';
import fixtures from '../__fixtures__/suiteActions';

const { getSuiteDevice } = global.JestMocks;

jest.mock('trezor-connect', () => {
    let fixture: any;
    return {
        __esModule: true, // this property makes it work
        default: {
            init: () => {},
            on: () => {},
            getFeatures: () =>
                fixture || {
                    success: true,
                },
            getDeviceState: () =>
                fixture || {
                    success: true,
                    payload: {
                        state: '0123456',
                    },
                },
            getAddress: () => {
                if (fixture && Array.isArray(fixture) && fixture.length > 0) {
                    const f = fixture[0];
                    fixture.splice(0, 1);
                    if (f) return f;
                }
                return {
                    success: true,
                    payload: {
                        address: '1234567890address',
                    },
                };
            },
        },
        DEVICE: {
            CONNECT: 'device-connect',
            DISCONNECT: 'device-disconnect',
        },
        TRANSPORT: {
            START: 'transport-start',
            ERROR: 'transport-error',
        },
        UI: {},
        setTestFixtures: (f: any) => {
            fixture = f;
        },
    };
});

jest.mock('next/router', () => {
    return {
        __esModule: true, // this property makes it work
        default: {
            back: () => {},
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;

export const getInitialState = (
    suite?: Partial<SuiteState>,
    devices?: DevicesState,
    router?: RouterState,
) => {
    return {
        suite: {
            ...suiteReducer(undefined, { type: 'foo' } as any),
            ...suite,
        },
        devices: devices || [],
        router: {
            ...routerReducer(undefined, { type: 'foo' } as any),
            ...router,
        },
        modal: modalReducer(undefined, { type: 'foo' } as any),
    };
};

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, devices, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().devices = deviceReducer(devices, action);
        store.getState().router = routerReducer(router, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Suite Actions', () => {
    fixtures.reducerActions.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState();
            const store = initStore(state);
            f.actions.forEach((action: any, i: number) => {
                store.dispatch(action);
                expect(store.getState().suite).toMatchObject(f.result[i]);
            });
        });
    });

    fixtures.initialRun.forEach(f => {
        it(f.description, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            store.dispatch(suiteActions.initialRunCompleted());
            expect(store.getState().suite).toMatchObject({
                initialRun: false,
            });
        });
    });

    fixtures.selectDevice.forEach(f => {
        it(`selectDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.devices);
            const store = initStore(state);
            await store.dispatch(suiteActions.selectDevice(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.handleDeviceConnect.forEach(f => {
        it(`handleDeviceConnect: ${f.description}`, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            await store.dispatch(suiteActions.handleDeviceConnect(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(f.result);
            }
        });
    });

    fixtures.handleDeviceDisconnect.forEach(f => {
        it(`handleDeviceDisconnect: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.devices);
            const store = initStore(state);
            store.dispatch({
                type: DEVICE.DISCONNECT, // TrezorConnect event to affect "deviceReducer"
                payload: f.device,
            });
            store.dispatch(suiteActions.handleDeviceDisconnect(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(1); // only DEVICE.DISCONNECT action present
            } else {
                const action = store.getActions().pop();
                if (f.result.type) {
                    expect(action.type).toEqual(f.result.type);
                }
                expect(action.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.observeSelectedDevice.forEach(f => {
        it(`observeSelectedDevice: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.devices);
            const store = initStore(state);
            const changed = store.dispatch(suiteActions.observeSelectedDevice(f.action as any));
            expect(changed).toEqual(f.changed);
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(f.result);
            }
        });
    });

    fixtures.acquireDevice.forEach(f => {
        it(`acquireDevice: ${f.description}`, async () => {
            require('trezor-connect').setTestFixtures(f.getFeatures);
            const state = getInitialState(f.state);
            const store = initStore(state);
            store.dispatch(init()); // trezorConnectActions.init needs to be called in order to wrap "getFeatures" with lockUi action
            await store.dispatch(suiteActions.acquireDevice());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(f.result);
            }
        });
    });

    fixtures.authorizeDevice.forEach(f => {
        it(`authorizeDevice: ${f.description}`, async () => {
            require('trezor-connect').setTestFixtures(f.getDeviceState);
            const state = getInitialState(f.state);
            const store = initStore(state);
            await store.dispatch(suiteActions.authorizeDevice());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(f.result);
            }
        });
    });

    fixtures.authConfirm.forEach(f => {
        it(`authConfirm: ${f.description}`, async () => {
            require('trezor-connect').setTestFixtures(f.getAddress);
            const state = getInitialState(f.state);
            const store = initStore(state);
            await store.dispatch(suiteActions.authConfirm());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action).toMatchObject(f.result);
            }
        });
    });

    fixtures.retryAuthConfirm.forEach(f => {
        it(`retryAuthConfirm: ${f.description}`, async () => {
            require('trezor-connect').setTestFixtures(f.getDeviceState);
            const state = getInitialState(f.state);
            const store = initStore(state);
            await store.dispatch(suiteActions.retryAuthConfirm());
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.type).toEqual(f.result);
            }
        });
    });

    const SUITE_DEVICE = getSuiteDevice({ path: '1' });
    it('forgetDevice', () => {
        const expectedAction = {
            type: SUITE.FORGET_DEVICE,
            payload: SUITE_DEVICE,
        };
        expect(suiteActions.forgetDevice(SUITE_DEVICE)).toEqual(expectedAction);
    });

    it('forgetDeviceInstance', () => {
        const expectedAction = {
            type: SUITE.FORGET_DEVICE_INSTANCE,
            payload: SUITE_DEVICE,
        };
        expect(suiteActions.forgetDeviceInstance(SUITE_DEVICE)).toEqual(expectedAction);
    });
});
