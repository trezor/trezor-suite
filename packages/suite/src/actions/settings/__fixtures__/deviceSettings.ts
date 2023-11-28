import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions } from '@suite-common/wallet-core';

import * as deviceSettingsActions from '../deviceSettingsActions';

const { getSuiteDevice } = testMocks;

export default [
    {
        description: 'Wipe device',
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: true, payload: { message: 'Success' } },
        deviceChange: getSuiteDevice({ path: '1' }, { device_id: 'new-device-id' }),
        result: {
            actions: [
                { type: deviceActions.deviceChanged.type },
                { type: deviceActions.updateSelectedDevice.type },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { features: { device_id: 'device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { features: { device_id: 'new-device-id' } },
                },
                { type: notificationsActions.addToast.type, payload: { type: 'device-wiped' } },
                { type: deviceActions.requestDeviceReconnect.type },
            ],
        },
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
                        state: '1',
                    }),
                    getSuiteDevice({
                        path: '1',
                        connected: true,
                        instance: 2,
                        state: '2',
                    }),
                ],
            },
        },
        action: () => deviceSettingsActions.wipeDevice(),
        mocks: { success: true, payload: { message: 'Success' } },
        deviceChange: getSuiteDevice({ path: '1' }, { device_id: 'new-device-id' }),
        result: {
            actions: [
                { type: deviceActions.deviceChanged.type },
                { type: deviceActions.updateSelectedDevice.type },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { features: { device_id: 'device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { instance: 1, features: { device_id: 'device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { instance: 2, features: { device_id: 'device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { features: { device_id: 'new-device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { instance: 1, features: { device_id: 'new-device-id' } },
                },
                {
                    type: deviceActions.forgetDevice.type,
                    payload: { instance: 2, features: { device_id: 'new-device-id' } },
                },
                { type: notificationsActions.addToast.type, payload: { type: 'device-wiped' } },
                { type: deviceActions.requestDeviceReconnect.type },
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
                    payload: { type: 'error', error: 'fuuu' },
                },
            ],
        },
    },
    {
        description: 'Apply settings',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [
                { type: notificationsActions.addToast.type, payload: { type: 'settings-applied' } },
            ],
        },
    },
    {
        description: 'Apply settings - connect error',
        action: () => deviceSettingsActions.applySettings({ label: 'foo' }),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'error', error: 'eeeh' },
                },
            ],
        },
    },
    {
        description: 'Change pin',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: true, payload: { message: 'huraa' } },
        result: {
            actions: [
                { type: notificationsActions.addToast.type, payload: { type: 'pin-changed' } },
            ],
        },
    },
    {
        description: 'Change pin - connect error',
        action: () => deviceSettingsActions.changePin({}),
        mocks: { success: false, payload: { error: 'eeeh' } },
        result: {
            actions: [
                {
                    type: notificationsActions.addToast.type,
                    payload: { type: 'error', error: 'eeeh' },
                },
            ],
        },
    },
];
