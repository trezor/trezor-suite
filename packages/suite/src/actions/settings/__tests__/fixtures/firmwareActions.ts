/* eslint-disable @typescript-eslint/camelcase */

import { SUITE } from '@suite-actions/constants';
import { FIRMWARE } from '@settings-actions/constants';
import { DEVICE, UI } from 'trezor-connect';

const { getSuiteDevice, getDeviceFeatures } = global.JestMocks;

const testDevice = getSuiteDevice();

export const firmwareUpdate = [
    {
        description: 'Success',
        mocks: {
            rollout: {
                success: new ArrayBuffer(512),
                error: false,
            },
            connect: {
                success: true,
            },
        },
        initialState: {
            suite: {
                device: getSuiteDevice({
                    connected: true,
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_ERROR, payload: undefined },
                { type: SUITE.LOCK_UI, payload: true },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                // todo: waiting-for-confirmation and installing is not tested
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'restarting' },
                { type: SUITE.LOCK_UI, payload: false },
            ],
            state: { firmware: { status: 'restarting' } },
        },
    },
    {
        description: 'Fails for missing device',
        initialState: {
            suite: {
                device: undefined,
            },
        },
        result: {
            state: { firmware: { status: 'error' } },
        },
    },
    {
        description: 'If UI is already locked, should not dispatch lock action',
        initialState: {
            suite: {
                locks: [SUITE.LOCK_TYPE.UI],
            },
        },
        mocks: {
            rollout: {
                error: 'foo',
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_ERROR, payload: undefined },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                { type: FIRMWARE.SET_ERROR, payload: 'failed to download firmware' },
            ],
        },
    },
    {
        description: 'Downloading fails for whatever reason thrown in rollout',
        mocks: {
            rollout: {
                error: 'foo',
            },
        },
        result: {
            state: { firmware: { status: 'error' } },
        },
    },
    {
        description: 'Downloading fails because rollout does not find suitable firmware',
        mocks: {
            rollout: {
                success: null,
            },
        },
        result: {
            state: { firmware: { status: 'error' } },
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails',
        initialState: {
            suite: {
                device: getSuiteDevice({
                    connected: true,
                    features: getDeviceFeatures({ major_version: 2 }),
                }),
            },
        },
        mocks: {
            rollout: {
                success: new ArrayBuffer(512),
                error: false,
            },
            connect: {
                success: false,
                payload: {
                    error: 'foo',
                },
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_ERROR, payload: undefined },
                { type: SUITE.LOCK_UI, payload: true },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                { type: FIRMWARE.SET_ERROR, payload: 'foo' },
                { type: SUITE.LOCK_UI, payload: false },
            ],
        },
    },
];

// various cases to test reducer through actions
export const reducerActions = [
    {
        description: 'DEVICE.DISCONNECT',
        initialState: {},
        action: {
            type: DEVICE.DISCONNECT,
            payload: testDevice,
        },
        result: {
            state: {
                firmware: { device: testDevice },
            },
        },
    },
    {
        description: 'UI.REQUEST_BUTTON, code=ButtonRequest_FirmwareUpdate',
        initialState: {},
        action: {
            type: UI.REQUEST_BUTTON,
            payload: {
                code: 'ButtonRequest_FirmwareUpdate',
            },
        },
        result: {
            state: {
                firmware: { status: 'waiting-for-confirmation' },
            },
        },
    },
    {
        description: 'UI.FIRMWARE_PROGRESS',
        initialState: {},
        action: {
            type: UI.FIRMWARE_PROGRESS,
            payload: {
                progress: 50,
            },
        },
        result: {
            state: {
                firmware: { status: 'installing', installingProgress: 50 },
            },
        },
    },
];
