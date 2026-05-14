import { firmwareActions, firmwareUpdate } from '@suite-common/firmware';
import { mockGetFirmwareReleaseConfigInfo, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { FirmwareType, UI_REQUEST } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

const bootloaderDevice = mockSuiteDevice({ mode: 'bootloader', connected: true });
const bootloaderDeviceNeedsIntermediary = {
    ...mockSuiteDevice(
        {
            mode: 'bootloader',
            connected: true,
            firmwareReleaseConfigInfo: {
                ...mockGetFirmwareReleaseConfigInfo(),
                intermediary: {
                    min_firmware_version: [1, 6, 2],
                    min_bootloader_version: [1, 6, 2],
                    version: 1,
                },
            },
        },
        { major_version: 1, internal_model: DeviceModelInternal.T1B1 },
    ),
};
const bootloaderDeviceNoIntermediaryT1 = {
    ...mockSuiteDevice(
        {
            mode: 'bootloader',
            connected: true,
            firmwareReleaseConfigInfo: {
                ...mockGetFirmwareReleaseConfigInfo(),
                intermediary: undefined,
            },
        },
        { major_version: 1, internal_model: DeviceModelInternal.T1B1 },
    ),
};
const firmwareUpdateResponsePayload = {
    check: 'valid',
    versionCheck: true,
};

export const actions = [
    {
        description: 'Success T2T1',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.setStatus.type, payload: 'done' },
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
                { type: firmwareActions.setStatus.type, payload: 'done' },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Success T1B1 (with intermediary)',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                {
                    type: firmwareActions.cacheDevice.type,
                    payload: bootloaderDeviceNeedsIntermediary,
                },
                { type: firmwareActions.setStatus.type, payload: 'done' },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Success T1B1 (without intermediary)',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                {
                    type: firmwareActions.cacheDevice.type,
                    payload: bootloaderDeviceNoIntermediaryT1,
                },
                { type: firmwareActions.setStatus.type, payload: 'done' },
            ],
            state: { firmware: { status: 'done' } },
        },
    },
    {
        description: 'Errors for missing device',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
        description: 'FirmwareUpdate call to connect errors',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
                error: {
                    message: 'foo',
                },
            },
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.setStatus.type, payload: 'error' },
                { type: firmwareActions.setFirmwareUpdateError.type, payload: 'foo' },
                {
                    type: firmwareUpdate.rejected.type,
                    payload: {
                        device: bootloaderDevice,
                        error: 'foo',
                        toBtcOnly: false,
                        toFwVersion: '2.0.0',
                    },
                },
            ],
        },
    },
    {
        description: 'FirmwareUpdate call to connect errors due to cancelling on device',
        action: () => firmwareUpdate({ firmwareType: FirmwareType.Universal }),
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
                error: {
                    message: 'Firmware install failed',
                },
            },
        },
        result: {
            actions: [
                { type: firmwareActions.setStatus.type, payload: 'started' },
                { type: firmwareActions.setTargetType.type, payload: FirmwareType.Universal },
                { type: firmwareActions.cacheDevice.type, payload: bootloaderDevice },
                { type: firmwareActions.setStatus.type, payload: 'error' },
                {
                    type: firmwareActions.setFirmwareUpdateError.type,
                    payload: 'Firmware install failed',
                },
                {
                    type: firmwareUpdate.rejected.type,
                    payload: {
                        device: bootloaderDevice,
                        error: 'Firmware install failed',
                        toBtcOnly: false,
                        toFwVersion: '2.0.0',
                    },
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
        description: 'UI_REQUEST.FIRMWARE_PROGRESS',
        initialState: {},
        action: {
            type: UI_REQUEST.FIRMWARE_PROGRESS,
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
