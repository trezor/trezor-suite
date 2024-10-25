import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    ConnectDeviceSettings,
    deviceActions,
    prepareDeviceReducer,
} from '@suite-common/wallet-core';
import suiteReducer from 'src/reducers/suite/suiteReducer';

import { extraDependencies } from 'src/support/extraDependencies';

import * as deviceSettingsActions from '../deviceSettingsActions';
import { TrezorDevice } from '@suite-common/suite-types';
import { Response } from '@trezor/connect';
import assert from 'assert';

const { getSuiteDevice } = testMocks;

export const deviceReducer = prepareDeviceReducer(extraDependencies);

export type DeviceSettingsFixtureState = {
    suite: ReturnType<typeof suiteReducer>;
    device: ReturnType<typeof deviceReducer>;
};

const deviceChange = getSuiteDevice({ path: '1' }, { device_id: 'new-device-id' });
assert(deviceChange.features !== undefined);

type Feature = {
    description: string;
    action: () => void;
    initialState: Partial<DeviceSettingsFixtureState>;
    deviceChange?: TrezorDevice;
    mocks: Awaited<Response<{ message: string }>>;
    result: {
        actions: Array<any>;
    };
};

const SUITE_SETTINGS: ConnectDeviceSettings = {
    defaultWalletLoading: 'standard',
};

const fixture: Feature[] = [
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
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
                        settings: SUITE_SETTINGS,
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
                        settings: SUITE_SETTINGS,
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'device-wiped', context: 'toast', id: expect.any(Number) },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
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
                devices: [
                    getSuiteDevice({
                        path: '1',
                        connected: true,
                    }),
                    getSuiteDevice({
                        path: '1',
                        connected: true,
                        instance: 1,
                        state: '1stTestnetAddress@device_1_id:0',
                    }),
                    getSuiteDevice({
                        path: '1',
                        connected: true,
                        instance: 2,
                        state: '1stTestnetAddress@device_2_id:0',
                    }),
                ],
            },
        },
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: true, payload: { message: 'Success' } },
        deviceChange: getSuiteDevice({ path: '1' }, { device_id: 'new-device-id' }),
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
                        settings: SUITE_SETTINGS,
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
                        },
                        settings: SUITE_SETTINGS,
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
                        },
                        settings: SUITE_SETTINGS,
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
                        settings: SUITE_SETTINGS,
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
                        settings: SUITE_SETTINGS,
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
                        settings: SUITE_SETTINGS,
                    },
                } satisfies ReturnType<typeof deviceActions.forgetDevice>,
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'device-wiped', context: 'toast', id: expect.any(Number) },
                } satisfies ReturnType<typeof notificationsActions.addToast>,
                {
                    type: deviceActions.requestDeviceReconnect.type,
                    payload: undefined,
                } satisfies ReturnType<typeof deviceActions.requestDeviceReconnect>,
            ],
        },
    },
    {
        description: 'Wipe device failed',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: false, payload: { error: 'fuuu' } },
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
            ],
        },
        initialState: {},
        deviceChange: undefined,
    },
    {
        description: 'Apply settings',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
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
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: false, payload: { error: 'eeeh' } },
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
        action: () => deviceSettingsActions.changePin({}),
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
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: false, payload: { error: 'eeeh' } },
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
];

export default fixture;
