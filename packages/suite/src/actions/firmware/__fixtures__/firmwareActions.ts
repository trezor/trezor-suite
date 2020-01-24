/* eslint-disable @typescript-eslint/camelcase */
import { UI } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { FIRMWARE } from '@firmware-actions/constants';

const { getSuiteDevice, getDeviceFeatures } = global.JestMocks;

const bootloaderDevice = getSuiteDevice({ mode: 'bootloader', connected: true });
// const testDevice = getSuiteDevice();

export const firmwareUpdate = [
    {
        description: 'Success T2',
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
            devices: [bootloaderDevice],
            suite: {
                device: bootloaderDevice,
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.RESET_REDUCER },
                { type: SUITE.LOCK_UI, payload: true },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },

                // todo: waiting-for-confirmation and installing is not tested
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success T1',
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
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1 }),
                }),
            },
            devices: [
                getSuiteDevice({
                    connected: true,
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1 }),
                }),
            ],
        },
        result: {
            actions: [
                { type: FIRMWARE.RESET_REDUCER },
                { type: SUITE.LOCK_UI, payload: true },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
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
        description: 'Fails for device not in bootloader',
        initialState: {
            suite: {
                device: getSuiteDevice({ connected: true, mode: 'normal' }),
            },
            devices: [getSuiteDevice({ connected: true, mode: 'normal' })],
        },
        result: {
            state: {
                firmware: { status: 'error', error: 'device must be connected in bootloader mode' },
            },
        },
    },
    // {
    //     description: 'Fails for more than 1 connected devices',
    //     initialState: {
    //         suite: {
    //             device: bootloaderDevice,
    //         },
    //         devices: [bootloaderDevice, testDevice],
    //     },
    //     result: {
    //         state: { firmware: { status: 'error' } },
    //     },
    // },
    {
        description: 'Downloading fails for whatever reason thrown in rollout',
        initialState: {
            suite: {
                device: bootloaderDevice,
            },
            devices: [bootloaderDevice],
        },
        mocks: {
            rollout: {
                error: 'foo',
            },
        },
        result: {
            state: { firmware: { status: 'error', error: 'failed to download firmware' } },
        },
    },
    {
        description: 'Downloading fails because rollout does not find suitable firmware',
        initialState: {
            suite: {
                device: bootloaderDevice,
            },
            devices: [bootloaderDevice],
        },
        mocks: {
            rollout: {
                success: null,
            },
        },
        result: {
            state: { firmware: { status: 'error', error: 'failed to download firmware' } },
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails',
        initialState: {
            suite: {
                device: bootloaderDevice,
            },
            devices: [bootloaderDevice],
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
                { type: FIRMWARE.RESET_REDUCER },
                { type: SUITE.LOCK_UI, payload: true },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'downloading' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_ERROR, payload: 'foo' },
                { type: SUITE.LOCK_UI, payload: false },
            ],
        },
    },
];

// various cases to test reducer through actions
export const reducerActions = [
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
