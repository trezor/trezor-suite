// unit test for suite actions
// data provided by TrezorConnect are mocked
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type AnalyticsDep } from '@suite-common/analytics';
import {
    type ConnectInitState,
    createConnectInitCompositionRoot,
} from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUiEventHooks,
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
import { type ConnectInitUiEventHooksDep, type LockDevice } from '@suite-common/suite-types';
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

// Suite reducer assertions need its own slice alongside the connect-init state.
type SuiteActionsTestState = SuiteRootState & ConnectInitState;

type SuiteActionsTestDeps = WithServices<
    AnalyticsDep & ConnectInitUiEventHooksDep & GetTradedAccountKeysDep
> & {
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

const createTestRoot = (preloadedState: SuiteActionsTestState) => {
    const analytics = mockDesktopAnalytics();
    const root = createTestCompositionRoot<SuiteActionsTestDeps, SuiteActionsTestState>({
        extra: {
            thunks: {
                fetchAndSaveMetadata: mockFetchAndSaveMetadata(),
            },
        },
        services: () => ({
            analytics,
            connectInitUiEventHooks: mockConnectInitUiEventHooks(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
        }),
        reducer: {
            suite: suiteReducer,
            device: deviceReducer,
            firmware: (state = preloadedState.firmware) => state,
            messageSystem: (state = preloadedState.messageSystem) => state,
            wallet: (state = preloadedState.wallet) => state,
        },
        preloadedState,
    });
    const { connectInit } = createConnectInitCompositionRoot({
        dispatch: root.services.store.dispatch,
        getState: root.services.store.getState,
        lockDevice: mock<LockDevice>(),
        analytics,
        connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
        connectInitSettings: mockConnectInitSettings(),
        createLogger: noopCreateLogger,
        createTransports: mockCreateTransports(),
        getAllowPrerelease: mockGetAllowPrerelease(),
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getDebugSettings: mockGetDebugSettings(),
        getThpSettings: mockGetThpSettings(),
    });

    return { ...root, connectInit };
};

describe('Suite Actions', () => {
    fixtures.reducerActions.forEach(f => {
        it(f.description, () => {
            const state = getInitialState();
            const { services } = createTestRoot(state);
            f.actions.forEach((action: any, i: number) => {
                services.store.dispatch(action);
                const result = f.result[i];
                if (!result) throw new Error(`Missing expected result at index ${i}`);
                expect(services.store.getState().suite).toMatchObject(result);
            });
        });
    });

    fixtures.selectDevice.forEach(f => {
        it(`selectDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device);
            const { services } = createTestRoot(state);
            await services.store.dispatch(selectDeviceThunk({ device: f.device }));
            if (!f.result) {
                expect(services.store.getActions().length).toEqual(0);
            } else {
                const action = filterThunkActionTypes(services.store.getActions()).pop();
                expect(action?.payload).toEqual(f.result.payload);
            }
        });
    });

    fixtures.selectNewlyConnectedDevice.forEach(f => {
        it(`selectNewlyConnectedDevice: ${f.description}`, async () => {
            const state = getInitialState({}, f.state.device);
            const { services } = createTestRoot(state);

            const device = f.newlyConnectedDevice;
            await services.store.dispatch(selectNewlyConnectedDeviceThunk({ device }));
            // a lot of actions may get called, and the one we are interested in may not be the last one
            expect(
                services.store.getActions().some(a => a?.type === f.expectedNextActionType),
            ).toBe(true);
        });
    });

    fixtures.markDeviceAsRecentlyConnected.forEach(f => {
        it(`markDeviceAsRecentlyConnected: ${f.description}`, async () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const { services } = createTestRoot(state);

            const device = f.newlyConnectedDevice;
            await services.store.dispatch(markDeviceAsRecentlyConnectedThunk(device));
            expect(
                services.store
                    .getActions()
                    .some(a => a?.type === SUITE.SET_RECENTLY_CONNECTED_DEVICE),
            ).toBe(f.isSetAsRecentlyConnected);
        });
    });

    fixtures.forgetDisconnectedDevices.forEach(f => {
        it(`forgetDisconnectedDevices: ${f.description}`, () => {
            const state = getInitialState(f.state.suite, f.state.device);
            const { services } = createTestRoot(state);
            services.store.dispatch(forgetDisconnectedDevicesThunk({ device: f.device }));
            const actions = filterThunkActionTypes(services.store.getActions());
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
            const { services } = createTestRoot(state);
            const observeResult = await services.store
                .dispatch(observeSelectedDeviceThunk())
                .unwrap();
            expect(observeResult).toEqual(f.observeResult);

            const actionTypes = filterThunkActionTypes(services.store.getActions()).map(
                action => action.type,
            );

            expect(actionTypes).toEqual(f.actions ?? []);
        });
    });

    fixtures.acquireDevice.forEach(f => {
        it(`acquireDevice: ${f.description}`, async () => {
            testMocks.setTrezorConnectFixtures(f.getFeatures || { success: true });
            const state = getInitialState(undefined, f.state.device);
            const { services, connectInit } = createTestRoot(state);
            await connectInit(); // connectInit needs to be called in order to wrap "getFeatures" with lockDevice
            await services.store.dispatch(
                acquireDeviceThunk({ requestedDevice: f.requestedDevice }),
            );
            // we are not interested in thunk state here
            const expectedActions = filterThunkActionTypes(services.store.getActions());
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
