// unit test for suite actions
// data provided by TrezorConnect are mocked
import { flagsInitialState, prepareFlagsReducer } from '@suite/flags';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { torReducer } from '@suite/tor';
import { connectInitThunk } from '@suite-common/connect-init';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { suiteSyncReducer } from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, filterThunkActionTypes, testMocks } from '@suite-common/test-utils';
import {
    acquireDevice,
    forgetDisconnectedDevices,
    observeSelectedDevice,
    selectDeviceThunk,
    selectNewlyConnectedDeviceThunk,
} from '@suite-common/wallet-core';

import { markDeviceAsRecentlyConnectedThunk } from 'src/actions/wallet/markDeviceAsRecentlyConnectedThunk';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { extraDependencies } from 'src/support/extraDependencies';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';

import fixtures from './__fixtures__/suiteActions';
import { SUITE } from './constants';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);
const flagsReducer = prepareFlagsReducer(extraDependencies);

type SuiteState = ReturnType<typeof suiteReducer>;
type DevicesState = ReturnType<typeof deviceReducer>;
type FirmwareState = ReturnType<typeof firmwareReducer>;

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DevicesState>,
    router?: RouterStateOverrides,
    firmware?: Partial<FirmwareState>,
    suiteSyncData?: Partial<ReturnType<typeof suiteSyncReducer>>,
) => ({
    suite: {
        ...suiteReducer(undefined, { type: 'foo' } as any),
        ...suite,
    },
    tor: torReducer(undefined, { type: 'foo' } as any),
    discreetMode: { isActive: false },
    flags: flagsInitialState,
    device: {
        ...deviceReducer(undefined, { type: 'foo' } as any),
        ...device,
    },
    router: createRouterStateMock(router),
    modal: modalReducer(undefined, { type: 'foo' } as any),
    firmware: {
        ...firmwareReducer(undefined, { type: 'foo' } as any),
        ...firmware,
    },
    suiteSync: {
        ...suiteSyncReducer(undefined, { type: 'foo' } as any),
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
const mockStore = (preloadedState: State) =>
    configureMockStore({
        reducer: (state = preloadedState, action) => ({
            ...state,
            suite: suiteReducer(state.suite, action),
            flags: flagsReducer(state.flags, action),
            device: deviceReducer(state.device, action),
            router: routerReducer(state.router, action),
        }),
        preloadedState,
    });

describe('Suite Actions', () => {
    fixtures.reducerActions.forEach(f => {
        it(f.description, () => {
            const state = getInitialState();
            const store = mockStore(state);
            f.actions.forEach((action: any, i: number) => {
                store.dispatch(action);
                const result = f.result[i];
                if (!result) throw new Error(`Missing expected result at index ${i}`);
                expect(store.getState().suite).toMatchObject(result);
            });
        });
    });

    fixtures.selectDevice.forEach(f => {
        it(`selectDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device);
            const store = mockStore(state);
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
            const state = getInitialState({}, f.state.device, undefined, f.state.firmware);
            const store = mockStore(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(selectNewlyConnectedDeviceThunk({ device }));
            // a lot of actions may get called, and the one we are interested in may not be the last one
            expect(store.getActions().some(a => a?.type === f.expectedNextActionType)).toBe(true);
        });
    });

    fixtures.markDeviceAsRecentlyConnected.forEach(f => {
        it(`markDeviceAsRecentlyConnected: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.device, undefined);
            const store = mockStore(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(markDeviceAsRecentlyConnectedThunk(device));
            expect(
                store.getActions().some(a => a?.type === SUITE.SET_RECENTLY_CONNECTED_DEVICE),
            ).toBe(f.isSetAsRecentlyConnected);
        });
    });

    fixtures.forgetDisconnectedDevices.forEach(f => {
        it(`forgetDisconnectedDevices: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const store = mockStore(state);
            store.dispatch(forgetDisconnectedDevices({ device: f.device }));
            const actions = filterThunkActionTypes(store.getActions());
            expect(actions.length).toEqual(f.result.length);
            actions.forEach((a, i) => {
                const result = f.result[i];
                if (!result) throw new Error(`Missing expected result at index ${i}`);
                expect(a.payload.device).toMatchObject(result);
            });
        });
    });

    fixtures.observeSelectedDevice.forEach(f => {
        it(`observeSelectedDevice: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const store = mockStore(state);
            const observeResult = await store.dispatch(observeSelectedDevice()).unwrap();
            expect(observeResult).toEqual(f.observeResult);

            const actionTypes = filterThunkActionTypes(store.getActions()).map(
                action => action.type,
            );

            expect(actionTypes).toEqual(f.actions ?? []);
        });
    });

    fixtures.acquireDevice.forEach(f => {
        it(`acquireDevice: ${f.description}`, async () => {
            testMocks.setTrezorConnectFixtures(f.getFeatures || { success: true });
            const state = getInitialState(undefined, f.state.device);
            const store = mockStore(state);
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
    });
});
