import { SUITE } from 'src/actions/suite/constants';
import { firmwareActions } from 'src/actions/firmware/firmwareActions';
import { firmwareUpdate } from 'src/actions/firmware/firmwareThunks';
import { FirmwareType } from 'src/types/suite';

import { UI } from '@trezor/connect';
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
        action: () => firmwareUpdate(),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setHash.type, payload: firmwareUpdateResponsePayload },
                // todo: waiting-for-confirmation and installing is not tested
                { type: firmwareActions.setStatus.type, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success TT - install Bitcoin-only firmware',
        action: () => firmwareUpdate(FirmwareType.BitcoinOnly),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.BitcoinOnly },
                { type: firmwareActions.setHash.type, payload: firmwareUpdateResponsePayload },
                // todo: waiting-for-confirmation and installing is not tested
                { type: firmwareActions.setStatus.type, payload: 'wait-for-reboot' },
            ],
            state: { firmware: { status: 'wait-for-reboot' } },
        },
    },
    {
        description: 'Success T1 (with intermediary)',
        action: () => firmwareUpdate(),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setIntermediaryInstalled.type, payload: true },
                { type: firmwareActions.setHash.type, payload: firmwareUpdateResponsePayload },
                { type: firmwareActions.setStatus.type, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Success T1 (without intermediary)',
        action: () => firmwareUpdate(),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setHash.type, payload: firmwareUpdateResponsePayload },
                { type: firmwareActions.setStatus.type, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Success T1 (without intermediary) - install Universal firmware',
        action: () => firmwareUpdate(FirmwareType.Universal),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                { type: firmwareActions.setHash.type, payload: firmwareUpdateResponsePayload },
                { type: firmwareActions.setStatus.type, payload: 'unplug' },
            ],
            state: { firmware: { status: 'unplug', error: undefined } },
        },
    },
    {
        description: 'Fails for missing device',
        action: () => firmwareUpdate(),
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
        action: () => firmwareUpdate(),
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
        action: () => firmwareUpdate(),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setError.type, payload: 'foo' },
            ],
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails due to cancelling on device',
        action: () => firmwareUpdate(),
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
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setError.type },
            ],
        },
    },
    {
        description: 'toggleHasSeed',
        action: () => firmwareActions.toggleHasSeed(),
        initialState: {},
        result: {
            actions: [{ type: firmwareActions.toggleHasSeed.type }],
        },
    },
    {
        description: 'setTargetRelease',
        action: () => firmwareActions.setTargetRelease(getSuiteDevice().firmwareRelease),
        initialState: {},
        result: {
            actions: [{ type: firmwareActions.setTargetRelease.type }],
        },
    },
    {
        description: 'resetReducer',
        action: () => firmwareActions.resetReducer(),
        initialState: {
            firmware: { hasSeed: true },
        },
        result: {
            actions: [{ type: firmwareActions.resetReducer.type }],
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
