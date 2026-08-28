// unit test for suite actions
// data provided by TrezorConnect are mocked
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { flagsInitialState, prepareFlagsReducer } from '@suite/flags';
import { lockDevice } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { routerReducer } from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import { torReducer } from '@suite/tor';
import { type AnalyticsDep } from '@suite-common/analytics';
import { type ConnectInitThunkDeps, connectInitThunk } from '@suite-common/connect-init';
import {
    mockConnectInitHooks,
    mockConnectInitSettings,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { type FetchAndSaveMetadataDep } from '@suite-common/metadata-types';
import { mockFetchAndSaveMetadata } from '@suite-common/metadata-types/mocks';
import { type WithServices } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { suiteSyncReducer } from '@suite-common/suite-sync';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { configureMockStore, filterThunkActionTypes, testMocks } from '@suite-common/test-utils';
import {
    acquireDevice,
    forgetDisconnectedDevices,
    observeSelectedDevice,
    selectDeviceThunk,
    selectNewlyConnectedDeviceThunk,
} from '@suite-common/wallet-core';
import { type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { noopCreateLogger } from '@trezor/connect-common';

import { markDeviceAsRecentlyConnectedThunk } from 'src/actions/wallet/markDeviceAsRecentlyConnectedThunk';
import suiteReducer from 'src/reducers/suite/suiteReducer';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';

import fixtures from './__fixtures__/suiteActions';
import { SUITE } from './constants';
const firmwareReducer = prepareFirmwareReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const flagsReducer = prepareFlagsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFlags: mockReducer() },
});

type SuiteActionsTestDeps = ConnectInitThunkDeps &
    WithServices<AnalyticsDep & GetTradedAccountKeysDep> & {
        thunks: FetchAndSaveMetadataDep;
    };

const extra: SuiteActionsTestDeps = {
    actions: { lockDevice },
    services: {
        analytics: mockDesktopAnalytics(),
        connectInitHooks: mockConnectInitHooks(),
        connectInitSettings: mockConnectInitSettings(),
        createLogger: noopCreateLogger,
        createTransports: mockCreateTransports(),
        getAllowPrerelease: mockGetAllowPrerelease(),
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getDebugSettings: mockGetDebugSettings(),
        getThpSettings: mockGetThpSettings(),
        getTradedAccountKeys: mockGetTradedAccountKeys(),
    },
    thunks: {
        fetchAndSaveMetadata: mockFetchAndSaveMetadata(),
    },
};

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
        extra,
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
                expect(deviceActions.forgetDevice.match(a)).toBe(true);
                if (deviceActions.forgetDevice.match(a)) {
                    expect(a.payload.device).toMatchObject(result);
                }
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
