// unit test for suite actions
// data provided by TrezorConnect are mocked
import type { UnknownAction } from '@reduxjs/toolkit';

import { modalReducer } from '@suite/modal';
import { appChanged, routerReducer } from '@suite/router';
import { connectInitThunk } from '@suite-common/connect-init';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { suiteSyncReducer } from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { testMocks } from '@suite-common/test-utils';
import {
    acquireDevice,
    forgetDisconnectedDevices,
    handleDeviceDisconnect,
    observeSelectedDevice,
    selectDeviceThunk,
    selectNewlyConnectedDeviceThunk,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

import { markDeviceAsRecentlyConnectedThunk } from 'src/actions/wallet/markDeviceAsRecentlyConnectedThunk';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { configureStore, filterThunkActionTypes } from 'src/support/tests/configureStore';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';

import fixtures from '../__fixtures__/suiteActions';
import { SUITE } from '../constants';
import * as suiteActions from '../suiteActions';

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
                    state: {
                        staticSessionId: `state@device-id:${device ? device.instance : undefined}`,
                    },
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
    suiteSyncData?: Partial<ReturnType<typeof suiteSyncReducer>>,
) => ({
    suite: {
        ...suiteReducer(undefined, appChanged('unknown')),
        ...suite,
    },
    device: {
        ...deviceReducer(undefined, appChanged('unknown')),
        ...device,
    },
    router: {
        ...routerReducer(undefined, appChanged('unknown')),
        ...router,
    },
    modal: modalReducer(undefined, appChanged('unknown')),
    firmware: {
        ...firmwareReducer(undefined, appChanged('unknown')),
        ...firmware,
    },
    suiteSync: {
        ...suiteSyncReducer(undefined, appChanged('unknown')),
    },
    suiteSyncData: {
        ...(suiteSyncData ?? {}),
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
        store.getState().router = routerReducer(router, action as UnknownAction);
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
            await store.dispatch(selectDeviceThunk({ device: f.device }));
            if (!f.result) {
                expect(store.getActions().length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(store.getActions()).pop();
                expect(action?.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.selectNewlyConnectedDevice.forEach(f => {
        it(`selectNewlyConnectedDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device, undefined);
            const store = initStore(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(selectNewlyConnectedDeviceThunk({ device }));
            // a lot of actions may get called, and the one we are interested in may not be the last one
            expect(store.getActions().some(a => a?.type === f.expectedNextActionType)).toBe(true);
        });
    });

    fixtures.markDeviceAsRecentlyConnected.forEach(f => {
        it(`markDeviceAsRecentlyConnected: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.device, undefined);
            const store = initStore(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(markDeviceAsRecentlyConnectedThunk(device));
            expect(
                store.getActions().some(a => a?.type === SUITE.SET_RECENTLY_CONNECTED_DEVICE),
            ).toBe(f.isSetAsRecentlyConnected);
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
            store.dispatch(forgetDisconnectedDevices({ device: f.device }));
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
            await store.dispatch(acquireDevice({ requestedDevice: f.requestedDevice }));
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
        const SUITE_DEVICE = mockSuiteDevice({ path: '1' });
        expect(deviceActions.forgetDevice({ device: SUITE_DEVICE })).toMatchObject({
            type: deviceActions.forgetDevice.type,
        });
        expect(suiteActions.setDebugMode({ showDebugMenu: true })).toMatchObject({
            type: SUITE.SET_DEBUG_MODE,
        });
    });
});
