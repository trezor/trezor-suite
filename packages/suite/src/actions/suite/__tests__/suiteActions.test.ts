/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable global-require */
// unit test for suite actions
// data provided by TrezorConnect are mocked

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import suiteReducer from '@suite-reducers/suiteReducer';
import deviceReducer from '@suite-reducers/deviceReducer';
import routerReducer from '@suite-reducers/routerReducer';
import * as suiteActions from '../suiteActions';
import { init } from '../trezorConnectActions';
import fixtures from './fixtures/suiteActions';

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
        },
        DEVICE: {
            CONNECT: 'device-connect',
        },
        TRANSPORT: {
            START: 'transport-start',
            ERROR: 'transport-error',
        },
        IFRAME: {
            LOADED: 'iframe-loaded',
        },
        setTestFixtures: (f: any) => {
            fixture = f;
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;

export const getInitialState = (
    suite?: Partial<SuiteState>,
    devices?: DevicesState,
    router?: Partial<RouterState>,
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
            const state = getInitialState(f.state.suite, f.state.devices);
            const store = initStore(state);
            require('next/router').default.push = (url: string) => {
                store.dispatch({
                    type: '@router/location-change',
                    url,
                });
            };
            await store.dispatch(suiteActions.selectDevice(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
                expect(action.payload).toEqual(f.result.payload);
                if (f.result.router) {
                    expect(store.getState().router).toMatchObject(f.result.router);
                }
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
            await store.dispatch(suiteActions.handleDeviceDisconnect(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = store.getActions().pop();
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

    fixtures.requestPassphraseMode.forEach(f => {
        it(`requestPassphraseMode: ${f.description}`, async () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            await store.dispatch(suiteActions.requestPassphraseMode());
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
});
