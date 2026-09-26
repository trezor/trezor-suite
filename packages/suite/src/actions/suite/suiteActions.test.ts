// unit test for suite actions
// data provided by TrezorConnect are mocked
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type AnalyticsDep } from '@suite-common/analytics';
import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUIEventHooks,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { mock } from '@suite-common/dependency-injection';
import {
    type DeviceReducerState,
    acquireDeviceThunk,
    deviceActions,
    deviceInitialState,
    prepareDeviceReducer,
    selectDeviceThunk,
    selectNewlyConnectedDeviceThunk,
} from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type FetchAndSaveMetadataDep } from '@suite-common/metadata-types';
import { mockFetchAndSaveMetadata } from '@suite-common/metadata-types/mocks';
import { type WithServices } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import {
    createTestCompositionRoot,
    filterThunkActionTypes,
    testMocks,
} from '@suite-common/test-utils';
import {
    forgetDisconnectedDevicesThunk,
    initialWalletSettingsState,
    observeSelectedDeviceThunk,
} from '@suite-common/wallet-core';
import { type GetTradedAccountKeysDep } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys } from '@suite-common/wallet-types/mocks';
import { noopCreateLogger } from '@trezor/connect-common';

import { markDeviceAsRecentlyConnectedThunk } from 'src/actions/wallet/markDeviceAsRecentlyConnectedThunk';
import suiteReducer, {
    type SuiteRootState,
    type SuiteState,
    suiteInitialState,
} from 'src/reducers/suite/suiteReducer';
import { discardMockedConnectInitActions } from 'src/utils/suite/storage';

import fixtures from './__fixtures__/suiteActions';
import { SUITE } from './constants';

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

type SuiteActionsTestState = SuiteRootState & ConnectInitThunkState;

type SuiteActionsTestDeps = ConnectInitThunkDeps &
    WithServices<AnalyticsDep & GetTradedAccountKeysDep> & {
        thunks: FetchAndSaveMetadataDep;
    };

const getInitialState = (
    suite?: Partial<SuiteState>,
    device?: Partial<DeviceReducerState>,
): SuiteActionsTestState => ({
    suite: { ...suiteInitialState, ...suite },
    device: { ...deviceInitialState, ...device },
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
    wallet: { settings: initialWalletSettingsState },
});

const createTestRoot = (preloadedState: SuiteActionsTestState) =>
    createTestCompositionRoot<SuiteActionsTestDeps, SuiteActionsTestState>({
        extra: {
            services: {
                analytics: mockDesktopAnalytics(),
                connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
                connectInitSettings: mockConnectInitSettings(),
                connectInitUIEventHooks: mockConnectInitUIEventHooks(),
                createLogger: noopCreateLogger,
                createTransports: mockCreateTransports(),
                getAllowPrerelease: mockGetAllowPrerelease(),
                getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
                getDebugSettings: mockGetDebugSettings(),
                getThpSettings: mockGetThpSettings(),
                getTradedAccountKeys: mockGetTradedAccountKeys(),
                lockDevice: mock<LockDevice>(),
            },
            thunks: {
                fetchAndSaveMetadata: mockFetchAndSaveMetadata(),
            },
        },
        reducer: {
            suite: suiteReducer,
            device: deviceReducer,
            firmware: (state = preloadedState.firmware) => state,
            messageSystem: (state = preloadedState.messageSystem) => state,
            wallet: (state = preloadedState.wallet) => state,
        },
        preloadedState,
    });

describe('Suite Actions', () => {
    fixtures.reducerActions.forEach(f => {
        it(f.description, () => {
            const state = getInitialState();
            const { store } = createTestRoot(state);
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
            const { store, services } = createTestRoot(state);
            await store.dispatch(selectDeviceThunk({ device: f.device }));
            if (!f.result) {
                expect(services.getActions().length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(services.getActions()).pop();
                expect(action?.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.selectNewlyConnectedDevice.forEach(f => {
        it(`selectNewlyConnectedDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device);
            const { store, services } = createTestRoot(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(selectNewlyConnectedDeviceThunk({ device }));
            // a lot of actions may get called, and the one we are interested in may not be the last one
            expect(services.getActions().some(a => a?.type === f.expectedNextActionType)).toBe(
                true,
            );
        });
    });

    fixtures.markDeviceAsRecentlyConnected.forEach(f => {
        it(`markDeviceAsRecentlyConnected: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const { store, services } = createTestRoot(state);

            const device = f.newlyConnectedDevice;
            await store.dispatch(markDeviceAsRecentlyConnectedThunk(device));
            expect(
                services.getActions().some(a => a?.type === SUITE.SET_RECENTLY_CONNECTED_DEVICE),
            ).toBe(f.isSetAsRecentlyConnected);
        });
    });

    fixtures.forgetDisconnectedDevices.forEach(f => {
        it(`forgetDisconnectedDevices: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const { store, services } = createTestRoot(state);
            store.dispatch(forgetDisconnectedDevicesThunk({ device: f.device }));
            const actions = filterThunkActionTypes(services.getActions());
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
            const { store, services } = createTestRoot(state);
            const observeResult = await store.dispatch(observeSelectedDeviceThunk()).unwrap();
            expect(observeResult).toEqual(f.observeResult);

            const actionTypes = filterThunkActionTypes(services.getActions()).map(
                action => action.type,
            );

            expect(actionTypes).toEqual(f.actions ?? []);
        });
    });

    fixtures.acquireDevice.forEach(f => {
        it(`acquireDevice: ${f.description}`, async () => {
            testMocks.setTrezorConnectFixtures(f.getFeatures || { success: true });
            const state = getInitialState(undefined, f.state.device);
            const { store, services } = createTestRoot(state);
            store.dispatch(connectInitThunk()); // connectInitThunk needs to be called in order to wrap "getFeatures" with lockDevice
            await store.dispatch(acquireDeviceThunk({ requestedDevice: f.requestedDevice }));
            // we are not interested in thunk state here
            const expectedActions = filterThunkActionTypes(
                discardMockedConnectInitActions(services.getActions()),
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
