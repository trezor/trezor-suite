import { type UnknownAction, combineReducers } from 'redux';

import { type LocksState, locksInitialState, locksReducer } from '@suite/locks';
import {
    type RouterState,
    getRoute,
    routerAppChanged,
    routerLocationChange,
    routerReducer,
} from '@suite/router';
import { type RouterStateOverrides, createRouterStateMock } from '@suite/router/mocks';
import {
    type SuiteSettingsState,
    prepareSuiteSettingsReducer,
    suiteSettingsInitialState,
} from '@suite/settings';
import {
    type DeviceReducerState,
    deviceActions,
    deviceReducerInitialState,
    prepareDeviceReducer,
} from '@suite-common/device';
import {
    type MessageSystemState,
    messageSystemInitialState,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import {
    type PersistentDeviceDataState,
    persistentDeviceDataActions,
    preparePersistentDeviceDataReducer,
} from '@suite-common/persistent-device-data';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type AcquiredDevice, type PersistentDeviceData } from '@suite-common/suite-types';
import { defaultDevicePersistentData, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type ThpState, initialThpState, prepareThpReducer, thpActions } from '@suite-common/thp';
import * as walletCore from '@suite-common/wallet-core';
import { discoveryInitialState, prepareDiscoveryReducer } from '@suite-common/wallet-core';
import type { Discovery } from '@suite-common/wallet-types';
import { asDeviceUniquePath } from '@trezor/connect-common';
import { DeviceModelInternal } from '@trezor/device-utils';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        startOrRestartDiscoveryThunk: jest.fn(() => ({ type: 'just-something-to-dispatch' })),
    };
});

const mockedStartOrRestartDiscoveryThunk = jest.mocked(walletCore.startOrRestartDiscoveryThunk);

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
const discoveryReducer = prepareDiscoveryReducer(undefined);
const messageSystemReducer = prepareMessageSystemReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const suiteSettingsReducer = prepareSuiteSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadSuiteSettings: mockReducer() },
});
const thpReducer = prepareThpReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const persistentDeviceDataReducer = preparePersistentDeviceDataReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadPersistentDeviceData: mockReducer() },
});

type State = {
    device: DeviceReducerState;
    locks: LocksState;
    messageSystem: MessageSystemState;
    router: RouterState;
    suiteSettings: SuiteSettingsState;
    thp: ThpState;
    wallet: { discovery: Discovery };
    persistentDeviceData: PersistentDeviceDataState;
};

type FixtureState = {
    device?: Partial<DeviceReducerState>;
    locks?: Partial<LocksState>;
    router?: RouterStateOverrides;
    thp?: Partial<ThpState>;
    discovery?: Discovery;
    persistentDeviceData?: Partial<PersistentDeviceDataState>;
};

type FixtureStep = {
    action: UnknownAction;
    expectedCallCount: number;
};

type Fixture = {
    description: string;
    state?: FixtureState;
    steps: FixtureStep[];
};

type LocationChangePayload = Parameters<typeof routerLocationChange>[0];
const changeLocationToDashboard = {
    pathname: '/',
    app: 'dashboard' as const,
    route: getRoute('suite-index'),
    params: undefined,
} as LocationChangePayload;

const path = asDeviceUniquePath('device-path');

const selectedDevice = mockSuiteDevice({
    path,
    connected: true,
    available: true,
    discovered: false, // selectShouldRediscover will return true
    state: { staticSessionId: 'device@selected:1' },
});

if (!isDeviceAcquired(selectedDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}
const compromisedDevice: AcquiredDevice = {
    ...selectedDevice,
    authenticityChecks: {
        firmwareRevision: { success: false, error: 'revision-mismatch' },
        firmwareHash: { success: false, error: 'hash-mismatch' },
    },
};

const unacquiredDevice = mockSuiteDevice({
    type: 'unacquired',
    path,
    connected: true,
    available: false,
    discovered: false, // selectShouldRediscover will return true
});

const disconnectedDevice = mockSuiteDevice({
    path,
    connected: false,
    available: true,
    discovered: false, // selectShouldRediscover will return true
    state: { staticSessionId: 'device@selected:1' },
});

// Device supporting Device Authenticity Check, unlike the default T2T1.
const trezorSafeDevice = mockSuiteDevice(
    {
        path,
        connected: true,
        available: true,
        discovered: false, // selectShouldRediscover will return true
        state: { staticSessionId: 'device@selected:1' },
    },
    { internal_model: DeviceModelInternal.T3T1 },
);

if (!isDeviceAcquired(trezorSafeDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}

// Persistent data must match the device model, otherwise device invariability check fails.
const getPersistentDataWithManualCheckSuccess = (device: AcquiredDevice): PersistentDeviceData => ({
    ...defaultDevicePersistentData,
    device_id: device.features.device_id,
    internal_model: device.features.internal_model,
    manualCheckResult: { success: true },
});

// By default, the device has passed Manual Device Check, and T2T1 doesn't support Device Authenticity Check,
// so the interactive device checks don't block discovery.
const persistentDataWithManualCheckSuccess =
    getPersistentDataWithManualCheckSuccess(selectedDevice);

const createObserveSelectedDeviceFulfilledAction = (payload: {
    isDeviceChanged: boolean;
    isDeviceBecomingAcquired: boolean;
    isDeviceBecomingConnected: boolean;
}) => walletCore.observeSelectedDeviceThunk.fulfilled(payload, 'request-id', undefined);

const fixtures: Fixture[] = [
    {
        description: 'starts discovery when device is selected',
        state: {
            router: { app: 'dashboard' },
        },
        steps: [
            {
                action: deviceActions.selectDevice(selectedDevice),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description: 'does not start discovery when compromised device warning should be displayed',
        state: {
            router: { app: 'dashboard' },
        },
        steps: [
            {
                action: deviceActions.selectDevice(compromisedDevice),
                expectedCallCount: 0,
            },
        ],
    },
    {
        description:
            'does not start discovery in an excluded route, until an enabled route is visited',
        state: {
            router: { app: 'settings' },
        },
        steps: [
            {
                action: deviceActions.selectDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: routerLocationChange(changeLocationToDashboard),
                expectedCallCount: 0,
            },
            {
                action: routerAppChanged('dashboard'),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description: 'starts discovery when device becomes acquired',
        state: {
            device: { selectedDevice: unacquiredDevice },
            router: { app: 'dashboard' },
        },
        steps: [
            {
                action: deviceActions.updateSelectedDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: createObserveSelectedDeviceFulfilledAction({
                    isDeviceChanged: true,
                    isDeviceBecomingAcquired: true,
                    isDeviceBecomingConnected: true,
                }),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description: 'starts discovery when device becomes connected',
        state: {
            device: { selectedDevice: disconnectedDevice },
            router: { app: 'dashboard' },
        },
        steps: [
            {
                action: deviceActions.updateSelectedDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: createObserveSelectedDeviceFulfilledAction({
                    isDeviceChanged: true,
                    isDeviceBecomingAcquired: false,
                    isDeviceBecomingConnected: true,
                }),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description:
            'does nothing when device becomes connected and selectShouldRediscover returns false',
        state: {
            device: { selectedDevice: disconnectedDevice },
            router: { app: 'dashboard' },
            // selectShouldRediscover will return false
            discovery: { [path]: { status: 'starting' } },
        },
        steps: [
            {
                action: deviceActions.updateSelectedDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: createObserveSelectedDeviceFulfilledAction({
                    isDeviceChanged: true,
                    isDeviceBecomingAcquired: false,
                    isDeviceBecomingConnected: true,
                }),
                expectedCallCount: 0,
            },
        ],
    },
    {
        description: 'does nothing on unrelated action even when the other conditions are met',
        state: {
            device: { selectedDevice },
            router: { app: 'dashboard' },
        },
        steps: [
            {
                action: { type: 'foo' },
                expectedCallCount: 0,
            },
        ],
    },
    {
        description:
            'does not start discovery while THP autoconnect modal is open, until the flow is finished',
        state: {
            device: { selectedDevice: unacquiredDevice },
            router: { app: 'dashboard' },
            thp: { autoconnectStep: 'AutoconnectInfo' },
        },
        steps: [
            {
                action: deviceActions.updateSelectedDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: createObserveSelectedDeviceFulfilledAction({
                    isDeviceChanged: true,
                    isDeviceBecomingAcquired: true,
                    isDeviceBecomingConnected: true,
                }),
                expectedCallCount: 0,
            },
            {
                action: thpActions.finishAutoconnectFlow(),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description:
            'does not start discovery while Manual Device Check is pending, until it succeeds',
        state: {
            router: { app: 'dashboard' },
            persistentDeviceData: {
                devices: [
                    { ...persistentDataWithManualCheckSuccess, manualCheckResult: undefined },
                ],
            },
        },
        steps: [
            {
                action: deviceActions.selectDevice(selectedDevice),
                expectedCallCount: 0,
            },
            {
                action: persistentDeviceDataActions.setManualDeviceCheckSuccess({
                    deviceId: selectedDevice.id,
                }),
                expectedCallCount: 1,
            },
        ],
    },
    {
        description:
            'does not start discovery while Device Authenticity Check is pending, until it succeeds',
        state: {
            router: { app: 'dashboard' },
            persistentDeviceData: {
                devices: [getPersistentDataWithManualCheckSuccess(trezorSafeDevice)],
            },
        },
        steps: [
            {
                action: deviceActions.selectDevice(trezorSafeDevice),
                expectedCallCount: 0,
            },
            // Manual Device Check is now one of the two steps; discovery shall start after both steps are done.
            {
                action: persistentDeviceDataActions.setManualDeviceCheckSuccess({
                    deviceId: selectedDevice.id,
                }),
                expectedCallCount: 0,
            },
            {
                action: persistentDeviceDataActions.setDeviceAuthenticityResult({
                    deviceId: trezorSafeDevice.id,
                    result: { valid: false, error: 'some-error' },
                }),
                expectedCallCount: 0,
            },
            {
                action: persistentDeviceDataActions.setDeviceAuthenticityResult({
                    deviceId: trezorSafeDevice.id,
                    result: {
                        valid: true,
                        optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
                        tropicResult: null,
                        mcuResult: null,
                    },
                }),
                expectedCallCount: 1,
            },
        ],
    },
];

const getInitialState = (state: FixtureState = {}): State => ({
    device: {
        ...deviceReducerInitialState,
        ...state.device,
    },
    locks: {
        ...locksInitialState,
        ...state.locks,
    },
    messageSystem: messageSystemInitialState,
    router: createRouterStateMock(state.router),
    suiteSettings: suiteSettingsInitialState,
    thp: {
        ...initialThpState,
        ...state.thp,
    },
    wallet: { discovery: { ...discoveryInitialState, ...state.discovery } },
    persistentDeviceData: {
        ...persistentDeviceDataReducer(undefined, { type: 'foo' }),
        devices: [persistentDataWithManualCheckSuccess],
        ...state.persistentDeviceData,
    },
});

const initStore = (state?: FixtureState) =>
    createTestCompositionRoot<void, State>({
        middleware: [prepareDiscoveryMiddleware(() => ({}))],
        reducer: {
            device: deviceReducer,
            locks: locksReducer,
            messageSystem: messageSystemReducer,
            router: routerReducer,
            suiteSettings: suiteSettingsReducer,
            thp: thpReducer,
            wallet: combineReducers({ discovery: discoveryReducer }),
            persistentDeviceData: persistentDeviceDataReducer,
        },
        preloadedState: getInitialState(state),
    }).services.store;

describe('discoveryMiddleware', () => {
    beforeEach(() => {
        mockedStartOrRestartDiscoveryThunk.mockClear();
    });

    fixtures.forEach(fixture => {
        it(fixture.description, async () => {
            const store = initStore(fixture.state);

            for (const step of fixture.steps) {
                // Must await the dispatch because this middleware is async.
                // TS says it isn't async because a dispatch can return anything – but in this case that's a Promise.
                await store.dispatch(step.action);
                expect(mockedStartOrRestartDiscoveryThunk).toHaveBeenCalledTimes(
                    step.expectedCallCount,
                );
            }
        });
    });
});
