/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
// unit test for suite actions
// data provided by TrezorConnect are mocked
import { testMocks } from '@suite-common/test-utils';
import {
    prepareDeviceReducer,
    selectDevice,
    selectDevices,
    selectDevicesCount,
    prepareFirmwareReducer,
    deviceActions,
    acquireDevice,
    authConfirm,
    authorizeDevice,
    createDeviceInstance,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    observeSelectedDevice,
    switchDuplicatedDevice,
    selectDeviceThunk,
    handleDeviceDisconnect,
} from '@suite-common/wallet-core';
import { connectInitThunk } from '@suite-common/connect-init';
import { DEVICE } from '@trezor/connect';

import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import routerReducer from 'src/reducers/suite/routerReducer';
import modalReducer from 'src/reducers/suite/modalReducer';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';
import { extraDependencies } from 'src/support/extraDependencies';

import { SUITE } from '../constants';
import * as suiteActions from '../suiteActions';
import fixtures from '../__fixtures__/suiteActions';

const { getSuiteDevice } = testMocks;

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);

jest.mock('@trezor/connect', () => {
    let fixture: any;

    const { PROTO } = jest.requireActual('@trezor/connect');

    return {
        __esModule: true, // this property makes it work
        default: {
            blockchainSetCustomBackend: () => {},
            init: () => {},
            on: () => {},
            getFeatures: () =>
                fixture || {
                    success: true,
                },
            getDeviceState: ({ device }: any) =>
                fixture || {
                    success: true,
                    payload: {
                        state: `state@device-id:${device ? device.instance : undefined}`,
                    },
                },
            applySettings: () =>
                fixture || {
                    success: true,
                },
        },
        DEVICE: {
            CHANGED: 'device-changed',
            CONNECT: 'device-connect',
            DISCONNECT: 'device-disconnect',
        },
        TRANSPORT: {
            START: 'transport-start',
            ERROR: 'transport-error',
        },
        BLOCKCHAIN: {},
        UI: {},
        PROTO,
        setTestFixtures: (f: any) => {
            fixture = f;
        },
        DeviceModelInternal: {
            T2T1: 'T2T1',
        },
    };
});

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type RouterState = ReturnType<typeof routerReducer>;
type FirmwareState = ReturnType<typeof firmwareReducer>;

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DevicesState>,
    router?: RouterState,
    firmware?: Partial<FirmwareState>,
) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    device: {
        ...deviceReducer(undefined, { type: 'foo' } as any),
        ...device,
    },
    router: {
        ...routerReducer(undefined, { type: 'foo' } as any),
        ...router,
    },
    modal: modalReducer(undefined, { type: 'foo' } as any),
    firmware: {
        ...firmwareReducer(undefined, { type: 'foo' } as any),
        ...firmware,
    },
    wallet: {
        settings: {
            enabledNetworks: [],
        },
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { suite, device, router } = store.getState();
        store.getState().suite = suiteReducer(suite, action);
        store.getState().device = deviceReducer(device, action);
        store.getState().router = routerReducer(router, action);
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

describe('Suite Actions', () => {
    fixtures.reducerActions.forEach(f => {
        it(f.description, () => {
            const state = getInitialState();
            const store = initStore(state);
            f.actions.forEach((action: any, i: number) => {
                store.dispatch(action);
                expect(store.getState().suite).toMatchObject(f.result[i]);
            });
        });
    });

    fixtures.initialRun.forEach(f => {
        it(f.description, () => {
            const state = getInitialState(f.state);
            const store = initStore(state);
            store.dispatch(suiteActions.initialRunCompleted());
            expect(store.getState().suite.flags.initialRun).toBe(false);
        });
    });

    fixtures.selectDevice.forEach(f => {
        it(`selectDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device);
            const store = initStore(state);
            await store.dispatch(selectDeviceThunk(f.device));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.handleDeviceConnect.forEach(f => {
        it(`handleDeviceConnect: ${f.description}`, async () => {
            const state = getInitialState(
                f.state.suite,
                f.state.device,
                undefined,
                f.state.firmware as FirmwareState,
            );
            const store = initStore(state);
            await store.dispatch(handleDeviceConnect(f.device));
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.type).toEqual(f.result);
            }
        });
    });

    fixtures.handleDeviceDisconnect.forEach(f => {
        it(`handleDeviceDisconnect: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const store = initStore(state);
            store.dispatch({
                type: DEVICE.DISCONNECT, // TrezorConnect event to affect "deviceReducer"
                payload: f.device,
            });
            store.dispatch(handleDeviceDisconnect(f.device));
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).pop()?.type).toEqual(
                    deviceActions.deviceDisconnect.type,
                );
            } else {
                const action = store.getActions().pop();
                if (f.result.type) {
                    expect(action.type).toEqual(f.result.type);
                }
                expect(action.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.forgetDisconnectedDevices.forEach(f => {
        it(`forgetDisconnectedDevices: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const store = initStore(state);
            store.dispatch(forgetDisconnectedDevices(f.device));
            const actions = filterThunkActionTypes(store.getActions());
            expect(actions.length).toEqual(f.result.length);
            actions.forEach((a, i) => {
                expect(a.payload).toMatchObject(f.result[i]);
            });
        });
    });

    fixtures.observeSelectedDevice.forEach(f => {
        it(`observeSelectedDevice: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const store = initStore(state);
            const changed = store.dispatch(observeSelectedDevice());
            expect(changed).toEqual(f.changed);
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.type).toEqual(f.result);
            }
        });
    });

    fixtures.acquireDevice.forEach(f => {
        it(`acquireDevice: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f.getFeatures);
            const state = getInitialState(undefined, f.state.device);
            const store = initStore(state);
            store.dispatch(connectInitThunk()); // trezorConnectActions.connectInitThunk needs to be called in order to wrap "getFeatures" with lockUi action
            await store.dispatch(acquireDevice(f.requestedDevice));
            // we are not interested in thunk state here
            const expectedActions = filterThunkActionTypes(
                discardMockedConnectInitActions(store.getActions()),
            );
            if (!f.result) {
                expect(expectedActions.length).toEqual(0);
            } else {
                const action = expectedActions.pop();
                expect(action?.type).toEqual(f.result);
            }
        });
    });

    fixtures.authorizeDevice.forEach(f => {
        it(`authorizeDevice: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f.getDeviceState);
            const state = getInitialState(undefined, {
                selectedDevice: f.suiteState?.selectedDevice,
                devices: f.devicesState ?? [],
            });
            const store = initStore(state);
            await store.dispatch(authorizeDevice());
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.type).toEqual(f.result);
                if (f.deviceReducerResult) {
                    const devices = selectDevices(store.getState());
                    devices.forEach((d, i) => {
                        const dev = f.deviceReducerResult[i];
                        expect(d.state).toEqual(dev.state);
                        expect(d.instance).toEqual(dev.instance);
                        expect(d.useEmptyPassphrase).toEqual(dev.useEmptyPassphrase);
                    });
                }
            }
        });
    });

    fixtures.authConfirm.forEach(f => {
        it(`authConfirm: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f.getDeviceState);
            const state = getInitialState(undefined, f.state);
            const store = initStore(state);
            await store.dispatch(authConfirm());
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action).toMatchObject(f.result);
            }
        });
    });

    fixtures.createDeviceInstance.forEach(f => {
        it(`createDeviceInstance: ${f.description}`, async () => {
            require('@trezor/connect').setTestFixtures(f.applySettings);
            const state = getInitialState(undefined, f.state.device);
            const store = initStore(state);
            await store.dispatch(createDeviceInstance({ device: f.state.device.selectedDevice }));
            if (!f.result) {
                expect(filterThunkActionTypes(store.getActions()).length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.type).toEqual(f.result);
            }
        });
    });

    fixtures.switchDuplicatedDevice.forEach(f => {
        it(`createDeviceInstance: ${f.description}`, async () => {
            const state = getInitialState(undefined, f.state.device);
            const store = initStore(state);
            await store.dispatch(
                switchDuplicatedDevice({ device: f.device, duplicate: f.duplicate }),
            );
            const device = selectDevice(store.getState());
            const devicesCount = selectDevicesCount(store.getState());
            expect(device).toEqual(f.result.selected);
            expect(devicesCount).toEqual(f.result.devices.length);
        });
    });

    // just for coverage
    it('misc', () => {
        const SUITE_DEVICE = getSuiteDevice({ path: '1' });
        expect(deviceActions.forgetDevice(SUITE_DEVICE)).toMatchObject({
            type: deviceActions.forgetDevice.type,
        });
        expect(suiteActions.setDebugMode({ showDebugMenu: true })).toMatchObject({
            type: SUITE.SET_DEBUG_MODE,
        });
    });
});
