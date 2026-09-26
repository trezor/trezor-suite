import { type UnknownAction } from '@reduxjs/toolkit';
import assert from 'assert';
import { type ThunkAction } from 'redux-thunk';

import { type ForgetBluetoothDeviceDep } from '@suite-common/bluetooth';
import {
    type DeviceRootState,
    deviceActions,
    deviceInitialState,
    prepareDeviceReducer,
} from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { type WithServices } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import {
    type OpenModalDep,
    type ReportSecurityCheckDep,
    type TrezorDevice,
} from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type ForgetDevicePersistentDataThunkState,
    wipeDeviceThunk,
} from '@suite-common/wallet-core';
import { type Response } from '@trezor/connect';

import * as deviceSettingsActions from '../deviceSettingsActions';
import { type ResetDeviceThunkState } from '../deviceSettingsActions';

export const deviceReducer = prepareDeviceReducer({
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

export type DeviceSettingsFixtureState = DeviceRootState;

export type DeviceSettingsActionsTestDeps = WithServices<ReportSecurityCheckDep> & {
    actions: OpenModalDep;
    thunks: ForgetBluetoothDeviceDep;
};

type DeviceSettingsAction = ThunkAction<
    unknown,
    ForgetDevicePersistentDataThunkState & ResetDeviceThunkState,
    DeviceSettingsActionsTestDeps,
    UnknownAction
>;

const deviceChange = mockSuiteDevice({ path: '1' }, { device_id: 'new-device-id' });
assert(deviceChange.features !== undefined);

type Fixture = {
    description: string;
    action: () => DeviceSettingsAction;
    initialState: Partial<DeviceSettingsFixtureState>;
    deviceChange?: TrezorDevice;
    mocks: Awaited<Response<{ message: string }>>;
    result: {
        actions: Array<any>;
    };
};

const fixture: Fixture[] = [
    {
        description: 'Wipe device',
        action: () => wipeDeviceThunk(),
        mocks: { success: true, payload: { message: 'Success' } },
        deviceChange,
        result: {
            actions: [
                {
                    type: deviceActions.deviceChanged.type,
                    payload: expect.any(Object),
                } satisfies ReturnType<typeof deviceActions.deviceChanged>,
                {
                    type: deviceActions.updateSelectedDevice.type,
                    payload: expect.any(Object),
                } satisfies ReturnType<typeof deviceActions.updateSelectedDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'device-id',
                            connected: true,
                            available: false,
                            features: { ...deviceChange.features, device_id: 'device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'new-device-id',
                            connected: true,
                            available: true,
                            features: { ...deviceChange.features, device_id: 'new-device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: persistentDeviceDataActions.forgetDevicePersistentData.type,
                    payload: { deviceId: 'device-id' },
                },
                {
                    type: '@modal/open-user-context',
                    payload: { type: 'wipe-device-success' },
                },
                {
                    type: deviceActions.requestDeviceReconnect.type,
                    payload: undefined,
                } satisfies ReturnType<typeof deviceActions.requestDeviceReconnect>,
            ],
        },
        initialState: {},
    },
    {
        description: 'Wipe device with multiple device instances',
        initialState: {
            device: {
                ...deviceInitialState,
                devices: [
                    mockSuiteDevice({
                        path: '1',
                        connected: true,
                    }),
                    mockSuiteDevice({
                        path: '1',
                        connected: true,
                        instance: 1,
                        state: { staticSessionId: '1stTestnetAddress@device_1_id:0' },
                    }),
                    mockSuiteDevice({
                        path: '1',
                        connected: true,
                        instance: 2,
                        state: { staticSessionId: '1stTestnetAddress@device_2_id:0' },
                    }),
                ],
            },
        },
        action: () => wipeDeviceThunk(),
        mocks: { success: true, payload: { message: 'Success' } },
        deviceChange: mockSuiteDevice({ path: '1' }, { device_id: 'new-device-id' }),
        result: {
            actions: [
                {
                    type: deviceActions.deviceChanged.type,
                    payload: expect.any(Object),
                } satisfies ReturnType<typeof deviceActions.deviceChanged>,
                {
                    type: deviceActions.updateSelectedDevice.type,
                    payload: expect.any(Object),
                } satisfies ReturnType<typeof deviceActions.updateSelectedDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'device-id',
                            connected: true,
                            available: false,
                            features: { ...deviceChange.features, device_id: 'device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'device-id',
                            connected: true,
                            available: false,
                            instance: 1,
                            state: { staticSessionId: '1stTestnetAddress@device_1_id:0' },
                            features: { ...deviceChange.features, device_id: 'device-id' },
                            useEmptyPassphrase: true,
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'device-id',
                            connected: true,
                            available: false,
                            instance: 2,
                            state: { staticSessionId: '1stTestnetAddress@device_2_id:0' },
                            features: { ...deviceChange.features, device_id: 'device-id' },
                            useEmptyPassphrase: true,
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'new-device-id',
                            connected: true,
                            available: true,
                            features: { ...deviceChange.features, device_id: 'new-device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'new-device-id',
                            connected: true,
                            available: true,
                            instance: 1,
                            state: { staticSessionId: '1stTestnetAddress@device_1_id:0' },
                            features: { ...deviceChange.features, device_id: 'new-device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: deviceActions.forgetDevice.type,
                    payload: {
                        device: {
                            ...deviceChange,
                            id: 'new-device-id',
                            connected: true,
                            available: true,
                            instance: 2,
                            state: { staticSessionId: '1stTestnetAddress@device_2_id:0' },
                            features: { ...deviceChange.features, device_id: 'new-device-id' },
                        },
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: persistentDeviceDataActions.forgetDevicePersistentData.type,
                    payload: { deviceId: 'device-id' },
                },
                {
                    type: '@modal/open-user-context',
                    payload: { type: 'wipe-device-success' },
                },
                {
                    type: deviceActions.requestDeviceReconnect.type,
                    payload: undefined,
                } satisfies ReturnType<typeof deviceActions.requestDeviceReconnect>,
            ],
        },
    },
    {
        description: 'Wipe device errored',
        action: () => wipeDeviceThunk(),
        mocks: { success: false, error: { message: 'fuuu', code: 'Failure_UnknownCode' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'error',
                        error: 'fuuu',
                        context: 'toast',
                        id: expect.any(Number),
                    },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
                {
                    type: wipeDeviceThunk.rejected.type,
                    payload: 'fuuu',
                },
            ],
        },
        initialState: {},
        deviceChange: undefined,
    },
    {
        description: 'Apply settings',
        action: () => deviceSettingsActions.applySettingsThunk({ label: 'foo' }),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'settings-applied', context: 'toast', id: expect.any(Number) },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
            ],
        },
        initialState: {},
    },
    {
        description: 'Apply settings - connect error',
        action: () => deviceSettingsActions.applySettingsThunk({ label: 'foo' }),
        mocks: { success: false, error: { message: 'eeeh', code: 'Failure_UnknownCode' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'error',
                        error: 'eeeh',
                        context: 'toast',
                        id: expect.any(Number),
                    },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
            ],
        },
        initialState: {},
    },
    {
        description: 'Change pin',
        action: () => deviceSettingsActions.changePinThunk({}),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'pin-changed', context: 'toast', id: expect.any(Number) },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
            ],
        },
        initialState: {},
    },
    {
        description: 'Change pin - connect error',
        action: () => deviceSettingsActions.changePinThunk({}),
        mocks: { success: false, error: { message: 'eeeh', code: 'Failure_UnknownCode' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'error',
                        error: 'eeeh',
                        context: 'toast',
                        id: expect.any(Number),
                    },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
            ],
        },
        initialState: {},
    },
    {
        description: 'Reset device - Cancel - Entropy check not triggered',
        action: () => deviceSettingsActions.resetDeviceThunk(),
        mocks: { success: false, error: { message: 'Canceled', code: 'Method_Cancel' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'error',
                        error: 'Canceled',
                        context: 'toast',
                        id: expect.any(Number),
                    },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
            ],
        },
        initialState: {
            device: {
                ...deviceInitialState,
                selectedDevice: mockSuiteDevice({
                    mode: 'initialize',
                }),
            },
        },
    },
    {
        description: 'Reset device - Entropy check success',
        action: () => deviceSettingsActions.resetDeviceThunk(),
        mocks: { success: true, payload: { message: 'whatever' } },
        result: {
            actions: [
                {
                    type: persistentDeviceDataActions.setEntropyCheckResult.type,
                    payload: { deviceId: 'device-id', success: true },
                } satisfies ReturnType<typeof persistentDeviceDataActions.setEntropyCheckResult>,
            ],
        },
        initialState: {
            device: {
                ...deviceInitialState,
                selectedDevice: mockSuiteDevice({ mode: 'initialize' }),
            },
        },
    },
    {
        description: 'Reset device - Entropy check errored - show Device compromised',
        action: () => deviceSettingsActions.resetDeviceThunk(),
        mocks: {
            success: false,
            error: { message: 'Entropy check failed', code: 'Failure_EntropyCheck' },
        },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: {
                        type: 'error',
                        error: 'Entropy check failed',
                        context: 'toast',
                        id: expect.any(Number),
                    },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
                {
                    type: persistentDeviceDataActions.setEntropyCheckResult.type,
                    payload: { deviceId: 'device-id', success: false },
                } satisfies ReturnType<typeof persistentDeviceDataActions.setEntropyCheckResult>,
            ],
        },
        initialState: {
            device: {
                ...deviceInitialState,
                selectedDevice: mockSuiteDevice({
                    mode: 'initialize',
                }),
            },
        },
    },
];

export default fixture;
