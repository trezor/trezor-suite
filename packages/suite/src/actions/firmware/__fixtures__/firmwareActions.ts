import { UI } from '@trezor/connect';
import { FIRMWARE } from 'src/actions/firmware/constants';
import { SUITE } from 'src/actions/suite/constants';
import * as firmwareActions from 'src/actions/firmware/firmwareActions';
import { FirmwareType } from 'src/types/suite';
import { DeviceModel } from '@trezor/device-utils';

const { getSuiteDevice, getDeviceFeatures, getFirmwareRelease } = global.JestMocks;

const bootloaderDevice = getSuiteDevice({ mode: 'bootloader', connected: true });
const bootloaderDeviceNeedsIntermediary = {
    ...getSuiteDevice(
        {
            mode: 'bootloader',
            connected: true,
            firmwareRelease: { ...getFirmwareRelease(), intermediaryVersion: 1 },
        },
        { major_version: 1, model: DeviceModel.T1 },
    ),
};
const firmwareUpdateResponsePayload = {
    hash: 'abc',
    challenge: 'def',
};

export const actions = [
    {
        description: 'Success TT',
        action: () => firmwareActions.firmwareUpdate(),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
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
                { type: FIRMWARE.SET_HASH, payload: firmwareUpdateResponsePayload },
                // todo: waiting-for-confirmation and installing is not tested
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success TT - install Bitcoin-only firmware',
        action: () => firmwareActions.firmwareUpdate(FirmwareType.BitcoinOnly),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
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
                { type: FIRMWARE.SET_TARGET_TYPE, payload: FirmwareType.BitcoinOnly },
                { type: FIRMWARE.SET_HASH, payload: firmwareUpdateResponsePayload },
                // todo: waiting-for-confirmation and installing is not tested
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success T1 (with intermediary)',
        action: () => firmwareActions.firmwareUpdate(),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            suite: {
                device: bootloaderDeviceNeedsIntermediary,
            },
            devices: [bootloaderDeviceNeedsIntermediary],
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_INTERMEDIARY_INSTALLED, payload: true },
                { type: FIRMWARE.SET_HASH, payload: firmwareUpdateResponsePayload },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Success T1 (without intermediary)',
        action: () => firmwareActions.firmwareUpdate(),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            suite: {
                device: getSuiteDevice({
                    connected: true,
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1, model: DeviceModel.T1 }),
                }),
            },
            devices: [
                getSuiteDevice({
                    connected: true,
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1, model: DeviceModel.T1 }),
                }),
            ],
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_HASH, payload: firmwareUpdateResponsePayload },
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Success T1 (without intermediary) - install Universal firmware',
        action: () => firmwareActions.firmwareUpdate(FirmwareType.Universal),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            suite: {
                device: getSuiteDevice({
                    connected: true,
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1, model: DeviceModel.T1 }),
                }),
            },
            devices: [
                getSuiteDevice({
                    connected: true,
                    mode: 'bootloader',
                    features: getDeviceFeatures({ major_version: 1, model: DeviceModel.T1 }),
                }),
            ],
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_TARGET_TYPE, payload: FirmwareType.Universal },
                { type: FIRMWARE.SET_HASH, payload: firmwareUpdateResponsePayload },
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
                    error: 'Firmware install failed',
                },
            },
        },
        result: {
            actions: [
                { type: FIRMWARE.SET_UPDATE_STATUS, payload: 'started' },
                { type: FIRMWARE.SET_ERROR },
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
            payload: { code: 'ButtonRequest_FirmwareUpdate' },
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
