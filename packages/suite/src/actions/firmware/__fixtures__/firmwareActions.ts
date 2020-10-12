/* eslint-disable @typescript-eslint/camelcase */
import { UI } from 'trezor-connect';
import { FIRMWARE } from '@firmware-actions/constants';
import { SUITE } from '@suite-actions/constants';
import * as firmwareActions from '@firmware-actions/firmwareActions';

const { getSuiteDevice, getDeviceFeatures } = global.JestMocks;

const bootloaderDevice = getSuiteDevice({ mode: 'bootloader', connected: true });

export const actions = [
    {
        description: 'Success T2',
        action: () => firmwareActions.firmwareUpdate(),
        mocks: {
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
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },

                // todo: waiting-for-confirmation and installing is not tested
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success T1',
        action: () => firmwareActions.firmwareUpdate(),
        mocks: {
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
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Fails for missing device',
        action: () => firmwareActions.firmwareUpdate(),
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
        action: () => firmwareActions.firmwareUpdate(),
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
    {
        description: 'FirmwareUpdate call to connect fails',
        action: () => firmwareActions.firmwareUpdate(),
        initialState: {
            suite: {
                device: bootloaderDevice,
            },
            devices: [bootloaderDevice],
        },
        mocks: {
            connect: {
                success: false,
                payload: {
                    error: 'foo',
                },
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_ERROR, payload: 'foo' },
            ],
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails due to cancelling on device',
        action: () => firmwareActions.firmwareUpdate(),
        initialState: {
            suite: {
                device: bootloaderDevice,
            },
            devices: [bootloaderDevice],
        },
        mocks: {
            connect: {
                success: false,
                payload: {
                    // this is temporary workaround for bug somewhere in connect/trezor-link/trezord?
                    error: "Cannot read property 'code' of null",
                },
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_ERROR, payload: 'Firmware update cancelled' },
            ],
        },
    },
    {
        description: 'toggleHasSeed',
        action: () => firmwareActions.toggleHasSeed(),
        initialState: {},
        result: {
            actions: [{ type: FIRMWARE.TOGGLE_HAS_SEED }],
        },
    },
    {
        description: 'setTargetRelease',
        action: () => firmwareActions.setTargetRelease(getSuiteDevice().firmwareRelease),
        initialState: {},
        result: {
            actions: [{ type: FIRMWARE.SET_TARGET_RELEASE }],
        },
    },

    {
        description: 'resetReducer',
        action: () => firmwareActions.resetReducer(),
        initialState: {
            firmware: { hasSeed: true },
        },
        result: {
            actions: [{ type: FIRMWARE.RESET_REDUCER }],
            state: {
                firmware: { hasSeed: false },
            },
        },
    },
];

// various cases to test reducer through actions
export const reducerActions = [
    {
        description: 'SUITE.ADD_BUTTON_REQUEST, type=ButtonRequest_FirmwareUpdate',
        initialState: {},
        action: {
            type: SUITE.ADD_BUTTON_REQUEST,
            payload: 'ButtonRequest_FirmwareUpdate',
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
