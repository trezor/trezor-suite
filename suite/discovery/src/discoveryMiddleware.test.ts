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
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { createTestStore } from '@suite-common/test-utils';
import { type ThpState, initialThpState, prepareThpReducer, thpActions } from '@suite-common/thp';
import * as walletCore from '@suite-common/wallet-core';
import { discoveryInitialState, prepareDiscoveryReducer } from '@suite-common/wallet-core';
import type { Discovery } from '@suite-common/wallet-types';
import { asDeviceUniquePath } from '@trezor/connect-common';

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

type State = {
    device: DeviceReducerState;
    locks: LocksState;
    messageSystem: MessageSystemState;
    router: RouterState;
    suiteSettings: SuiteSettingsState;
    thp: ThpState;
    wallet: { discovery: Discovery };
};

type FixtureState = {
    device?: Partial<DeviceReducerState>;
    locks?: Partial<LocksState>;
    router?: RouterStateOverrides;
    thp?: Partial<ThpState>;
    discovery?: Discovery;
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

const createObserveSelectedDeviceFulfilledAction = (payload: {
    isDeviceChanged: boolean;
    isDeviceBecomingAcquired: boolean;
    isDeviceBecomingConnected: boolean;
}) => walletCore.observeSelectedDevice.fulfilled(payload, 'request-id', undefined);

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
});

const initStore = (state?: FixtureState) =>
    createTestStore({
        extra: undefined,
        middleware: [prepareDiscoveryMiddleware(() => ({}))],
        reducer: {
            device: deviceReducer,
            locks: locksReducer,
            messageSystem: messageSystemReducer,
            router: routerReducer,
            suiteSettings: suiteSettingsReducer,
            thp: thpReducer,
            wallet: combineReducers({ discovery: discoveryReducer }),
        },
        preloadedState: getInitialState(state),
    });

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
