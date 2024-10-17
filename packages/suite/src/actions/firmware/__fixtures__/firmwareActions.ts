import { testMocks } from '@suite-common/test-utils';
import { firmwareUpdate, firmwareActions } from '@suite-common/wallet-core';
import { UI, DeviceModelInternal, FirmwareType } from '@trezor/connect';

const { getSuiteDevice, getFirmwareRelease } = testMocks;

const bootloaderDevice = getSuiteDevice({ mode: 'bootloader', connected: true });
const bootloaderDeviceNeedsIntermediary = {
    ...getSuiteDevice(
        {
            mode: 'bootloader',
            connected: true,
            firmwareRelease: { ...getFirmwareRelease(), intermediaryVersion: 1 },
        },
        { major_version: 1, internal_model: DeviceModelInternal.T1B1 },
    ),
};
const bootloaderDeviceNoIntermediaryT1 = {
    ...getSuiteDevice(
        {
            mode: 'bootloader',
            connected: true,
            firmwareRelease: { ...getFirmwareRelease(), intermediaryVersion: undefined },
        },
        { major_version: 1, internal_model: DeviceModelInternal.T1B1 },
    ),
};
const firmwareUpdateResponsePayload = {
    hash: 'abc',
    challenge: 'def',
};

export const actions = [
    {
        description: 'Success T2T1',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            device: {
                devices: [bootloaderDevice],
                selectedDevice: bootloaderDevice,
            },
            suite: {},
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Regular },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.clearInvalidHash.type, payload: 'device-id' },
                { type: firmwareActions.setStatus.type, payload: 'done' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: undefined },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Success T2T1 - install Bitcoin-only firmware',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.BitcoinOnly }),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            device: {
                devices: [bootloaderDevice],
                selectedDevice: bootloaderDevice,
            },
            suite: {},
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.BitcoinOnly },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.clearInvalidHash.type, payload: 'device-id' },
                { type: firmwareActions.setStatus.type, payload: 'done' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: undefined },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Success T1B1 (with intermediary)',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            device: {
                selectedDevice: bootloaderDeviceNeedsIntermediary,
                devices: [bootloaderDeviceNeedsIntermediary],
            },
            suite: {},
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Regular },
                {
                    type: firmwareActions.cacheDevice.type,
                    payload: bootloaderDeviceNeedsIntermediary,
                },
                { type: firmwareActions.clearInvalidHash.type, payload: 'device-id' },
                { type: firmwareActions.setStatus.type, payload: 'done' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: undefined },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Success T1B1 (without intermediary)',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        mocks: {
            connect: {
                success: true,
                payload: firmwareUpdateResponsePayload,
            },
        },
        initialState: {
            device: {
                selectedDevice: bootloaderDeviceNoIntermediaryT1,
                devices: [bootloaderDeviceNoIntermediaryT1],
            },
            suite: {},
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Regular },
                {
                    type: firmwareActions.cacheDevice.type,
                    payload: bootloaderDeviceNoIntermediaryT1,
                },
                { type: firmwareActions.clearInvalidHash.type, payload: 'device-id' },
                { type: firmwareActions.setStatus.type, payload: 'done' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: undefined },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Fails for missing device',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        initialState: {
            device: {
                selectedDevice: undefined,
            },
            suite: {},
        },
        result: {
            state: { firmware: { status: 'error' } },
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        initialState: {
            device: {
                selectedDevice: bootloaderDevice,
                devices: [bootloaderDevice],
            },
            suite: {},
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
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Regular },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.setStatus.type, payload: 'error' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: 'foo' },
            ],
        },
    },
    {
        description: 'FirmwareUpdate call to connect fails due to cancelling on device',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Regular }),
        initialState: {
            device: {
                selectedDevice: bootloaderDevice,
                devices: [bootloaderDevice],
            },
            suite: {},
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
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Regular },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.setStatus.type, payload: 'error' },
                {
                    type: firmwareActions.setFirmwareUpdateError.type,
                    payload: 'Firmware install failed',
                },
            ],
        },
    },
    {
        description: 'resetReducer',
        action: () => firmwareActions.resetReducer(),
        result: {
            actions: [{ type: firmwareActions.resetReducer.type }],
        },
    },
];

// various cases to test reducer through actions
export const reducerActions = [
    {
        description: 'UI.FIRMWARE_PROGRESS',
        initialState: {},
        action: {
            type: UI.FIRMWARE_PROGRESS,
            payload: {
                operation: 'flashing',
                progress: 50,
            },
        },
        result: {
            state: {
                firmware: {
                    uiEvent: {
                        payload: {
                            operation: 'flashing',
                            progress: 50,
                        },
                    },
                },
            },
        },
    },
];
