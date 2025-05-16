// unit test for suite actions
// data provided by TrezorConnect are mocked
import { connectInitThunk } from '@suite-common/connect-init';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { testMocks } from '@suite-common/test-utils';
import {
    ConnectDeviceSettings,
    acquireDevice,
    createDeviceInstanceThunk,
    deviceActions,
    forgetDisconnectedDevices,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    prepareDeviceReducer,
    selectDeviceThunk,
    selectDevices,
    selectDevicesCount,
    selectSelectedDevice,
    switchDuplicatedDevice,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

import modalReducer from 'src/reducers/suite/modalReducer';
import routerReducer from 'src/reducers/suite/routerReducer';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';

import fixtures from '../__fixtures__/suiteActions';
import { SUITE } from '../constants';
import * as suiteActions from '../suiteActions';

const { getSuiteDevice } = testMocks;

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);

const TrezorConnect = testMocks.getTrezorConnectMock();

const setTrezorConnectFixtures = (fixture: any) => {
    jest.spyOn(TrezorConnect, 'getFeatures').mockImplementation(
        () =>
            fixture || {
                success: true,
            },
    );
    jest.spyOn(TrezorConnect, 'getDeviceState').mockImplementation(
        ({ device }: any) =>
            fixture || {
                success: true,
                payload: {
                    state: `state@device-id:${device ? device.instance : undefined}`,
                },
            },
    );
    jest.spyOn(TrezorConnect, 'applySettings').mockImplementation(
        () =>
            fixture || {
                success: true,
            },
    );
};

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

const SUITE_SETTINGS: ConnectDeviceSettings = {
    defaultWalletLoading: 'standard',
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
            await store.dispatch(selectDeviceThunk({ device: f.device }));
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
            const state = getInitialState(f.state.suite, f.state.device, undefined);
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
                expect(a.payload.device).toMatchObject(f.result[i]);
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
            setTrezorConnectFixtures(f.getFeatures);
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

    // just for coverage
    it('misc', () => {
        const SUITE_DEVICE = getSuiteDevice({ path: '1' });
        expect(
            deviceActions.forgetDevice({ device: SUITE_DEVICE, settings: SUITE_SETTINGS }),
        ).toMatchObject({
            type: deviceActions.forgetDevice.type,
        });
        expect(suiteActions.setDebugMode({ showDebugMenu: true })).toMatchObject({
            type: SUITE.SET_DEBUG_MODE,
        });
    });
});
