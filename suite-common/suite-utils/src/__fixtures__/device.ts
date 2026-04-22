import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import * as URLS from '@trezor/urls';

const SUITE_DEVICE = mockSuiteDevice();
const connected = { connected: true, available: true };

const getStatus: Array<{ device: TrezorDevice; status: string }> = [
    {
        device: SUITE_DEVICE,
        status: 'disconnected',
    },
    {
        device: mockSuiteDevice({ connected: true, available: false }),
        status: 'unavailable',
    },
    {
        device: mockSuiteDevice({ ...connected, mode: 'bootloader' }),
        status: 'bootloader',
    },
    {
        device: mockSuiteDevice({ ...connected, mode: 'initialize' }),
        status: 'initialize',
    },
    {
        device: mockSuiteDevice({ ...connected, mode: 'seedless' }),
        status: 'seedless',
    },
    {
        device: mockSuiteDevice({ ...connected, firmware: 'required' }),
        status: 'firmware-required',
    },
    {
        device: mockSuiteDevice({ ...connected, status: 'occupied' }),
        status: 'used-in-other-window',
    },
    {
        device: mockSuiteDevice({ ...connected, status: 'used' }),
        status: 'was-used-in-other-window',
    },
    {
        device: mockSuiteDevice({ ...connected, firmware: 'outdated' }),
        status: 'firmware-recommended',
    },
    {
        device: mockSuiteDevice(connected),
        status: 'connected',
    },
    {
        device: mockSuiteDevice({ connected: true, available: false, type: 'unacquired' }),
        status: 'unacquired',
    },
    {
        device: mockSuiteDevice({ connected: true, available: false, type: 'unreadable' }),
        status: 'unreadable',
    },
    {
        device: mockSuiteDevice({
            connected: true,
            available: false,
            type: 'unacquired',
            status: 'thp-locked',
        }),
        status: 'device-thp-locked',
    },
    {
        device: mockSuiteDevice({
            connected: true,
            available: false,
            status: 'thp-locked',
        }),
        status: 'device-thp-locked',
    },
];

const getIsDeviceDescriptorApiTypeBluetooth = [
    {
        description: 'device descriptor is missing',
        device: mockSuiteDevice({
            descriptor: undefined,
        }),
        result: false,
    },
    {
        description: 'device api type is usb',
        device: mockSuiteDevice({
            descriptor: { apiType: 'usb' },
        }),
        result: false,
    },
    {
        description: 'device api type is bluetooth',
        device: mockSuiteDevice({
            descriptor: { apiType: 'bluetooth' },
        }),
        result: true,
    },
];

const getIsDeviceConnectedViaBluetooth = [
    {
        description: 'device is connected via bluetooth',
        device: mockSuiteDevice({
            descriptor: { apiType: 'bluetooth' },
            connected: true,
        }) as TrezorDevice,
        result: true,
    },
    {
        description: 'device is not connected and api type is bluetooth',
        device: mockSuiteDevice({
            descriptor: { apiType: 'bluetooth' },
            connected: false,
        }) as TrezorDevice,
        result: false,
    },
    {
        description: 'device is connected via usb',
        device: { ...SUITE_DEVICE, descriptor: { apiType: 'usb' } } as TrezorDevice,
        result: false,
    },
    {
        description: 'device is undefined',
        device: undefined,
        result: false,
    },
];

const isSelectedDevice = [
    {
        description: `Device is selected`,
        selected: SUITE_DEVICE,
        device: SUITE_DEVICE,
        result: true,
    },
    {
        description: `Device is not selected (currently selected is not defined)`,
        selected: undefined,
        device: SUITE_DEVICE,
        result: false,
    },
    {
        description: `Device is not selected (device is not defined)`,
        selected: SUITE_DEVICE,
        device: undefined,
        result: false,
    },
    {
        description: `Device is not selected (currently selected is unacquired)`,
        selected: mockSuiteDevice({ type: 'unacquired' }),
        device: SUITE_DEVICE,
        result: false,
    },
    {
        description: `Device is not selected (device is unacquired)`,
        selected: SUITE_DEVICE,
        device: mockSuiteDevice({ type: 'unacquired' }),
        result: false,
    },
    {
        description: `Device is not selected (device_id is different)`,
        selected: SUITE_DEVICE,
        device: mockSuiteDevice(undefined, { device_id: 'different' }),
        result: false,
    },
];

const isSelectedInstance = [
    {
        description: `Device instance is selected`,
        selected: SUITE_DEVICE,
        device: SUITE_DEVICE,
        result: true,
    },
    {
        description: `Device instance is not selected (currently selected is not defined)`,
        selected: undefined,
        device: SUITE_DEVICE,
        result: false,
    },
    {
        description: `Device instance is not selected (device is not defined)`,
        selected: SUITE_DEVICE,
        device: undefined,
        result: false,
    },
    {
        description: `Device instance is not selected (device_id is different)`,
        selected: SUITE_DEVICE,
        device: mockSuiteDevice(undefined, { device_id: 'different' }),
        result: false,
    },
    {
        description: `Device instance is not selected (instance is different)`,
        selected: SUITE_DEVICE,
        device: mockSuiteDevice({ instance: 1 }),
        result: false,
    },
];

const getNewInstanceNumber = [
    {
        description: `first instance`,
        state: [SUITE_DEVICE],
        device: SUITE_DEVICE,
        result: 1,
    },
    {
        description: `second instance`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 })],
        device: SUITE_DEVICE,
        result: 2,
    },
    {
        description: `odd instances`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 }), mockSuiteDevice({ instance: 4 })],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `odd mixed unsorted instances`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 4 }), mockSuiteDevice({ instance: 1 })],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `device not found in state`,
        state: [
            mockSuiteDevice(undefined, {
                device_id: 'ignored-device-id',
            }),
        ],
        device: SUITE_DEVICE,
        result: undefined,
    },
    {
        description: `device doesn't exists in state`,
        state: [],
        device: SUITE_DEVICE,
        result: undefined,
    },
];

const getNewWalletNumber = [
    {
        description: `first instance`,
        state: [SUITE_DEVICE],
        device: SUITE_DEVICE,
        result: 1,
    },
    {
        description: `second instance`,
        state: [SUITE_DEVICE, mockSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false })],
        device: SUITE_DEVICE,
        result: 2,
    },
    {
        description: `odd instances`,
        state: [
            SUITE_DEVICE,
            mockSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
            mockSuiteDevice({ walletNumber: 4, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `odd mixed unsorted instances`,
        state: [
            SUITE_DEVICE,
            mockSuiteDevice({ walletNumber: 4, useEmptyPassphrase: false }),
            mockSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `standard wallet id skipped`,
        state: [
            SUITE_DEVICE,
            mockSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
            mockSuiteDevice({ walletNumber: undefined, useEmptyPassphrase: true }),
            mockSuiteDevice({ walletNumber: 3, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 4,
    },
    {
        description: `device not found in state`,
        state: [
            mockSuiteDevice(undefined, {
                device_id: 'ignored-device-id',
            }),
        ],
        device: SUITE_DEVICE,
        result: 1,
    },
    {
        description: `device doesn't exists in state`,
        state: [],
        device: SUITE_DEVICE,
        result: 1,
    },
];

const findInstanceIndex = [
    {
        description: `get first instance`,
        state: [SUITE_DEVICE],
        device: SUITE_DEVICE,
        result: 0,
    },
    {
        description: `get second instance`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 })],
        device: mockSuiteDevice({ instance: 1 }),
        result: 1,
    },
    {
        description: `get second from mixed instances`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 4 }), mockSuiteDevice({ instance: 1 })],
        device: mockSuiteDevice({ instance: 4 }),
        result: 1,
    },
    {
        description: `unknown instance (not found)`,
        state: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 })],
        device: mockSuiteDevice({ instance: 2 }),
        result: -1,
    },
    {
        description: `unknown instance (empty state)`,
        state: [],
        device: SUITE_DEVICE,
        result: -1,
    },
    {
        description: `unknown instance (different device)`,
        state: [
            mockSuiteDevice(undefined, {
                device_id: 'ignored-device-id',
            }),
        ],
        device: SUITE_DEVICE,
        result: -1,
    },
];

const getSelectedDevice = [
    {
        description: `unacquired device`,
        device: mockSuiteDevice({ type: 'unacquired' }),
        state: [mockSuiteDevice({ type: 'unacquired' })],
        result: mockSuiteDevice({ type: 'unacquired' }),
    },
    {
        description: `bootloader device`,
        device: mockSuiteDevice({ mode: 'bootloader' }),
        state: [mockSuiteDevice({ mode: 'bootloader' })],
        result: mockSuiteDevice({ mode: 'bootloader' }),
    },
    {
        description: `acquired device`,
        device: SUITE_DEVICE,
        state: [SUITE_DEVICE],
        result: SUITE_DEVICE,
    },
    {
        description: `unknown device (empty state)`,
        device: SUITE_DEVICE,
        state: [],
        result: undefined,
    },
    {
        description: `unknown device (not found)`,
        device: SUITE_DEVICE,
        state: [
            mockSuiteDevice(undefined, {
                device_id: 'ignored-device-id',
            }),
        ],
        result: undefined,
    },
    {
        description: `identical device, but with different device_id because of preceding device-wipe call`,
        device: mockSuiteDevice({ path: '1' }, { device_id: '2' }),
        state: [mockSuiteDevice({ path: '1' }, { device_id: '3' })],
        result: mockSuiteDevice({ path: '1' }, { device_id: '3' }),
    },
];

const sortByTimestamp = {
    devices: [{ id: 1, ts: 1 }, { id: 2 }, { id: 3 }, { id: 5, ts: 3 }, { id: 4, ts: 2 }],
    result: [{ id: 5, ts: 3 }, { id: 4, ts: 2 }, { id: 1, ts: 1 }, { id: 2 }, { id: 3 }],
};

const isDeviceRemembered = [
    {
        description: 'acquired non remembered device',
        device: mockSuiteDevice({ type: 'acquired', remember: true }),
        result: true,
    },
    {
        description: 'acquired remembered device',
        device: mockSuiteDevice({ type: 'acquired', remember: false }),
        result: false,
    },
];

const d = (obj: any) => ({
    id: obj.id,
    path: obj.path ? obj.path : obj.id,
    features: obj.id
        ? {
              device_id: obj.id,
          }
        : undefined,
    mode: obj.mode || 'normal',
    firmware: obj.fw || 'valid',
    instance: obj.inst,
    ts: obj.ts,
});

const getFirstDeviceInstance = [
    {
        description: 'All devices are unacquired',
        devices: [d({ path: '1' }), d({ id: '3' }), d({ path: '2' })],
        result: [d({ path: '1' }), d({ path: '2' }), d({ id: '3' })],
    },
    {
        description: 'Sorted by priority',
        devices: [
            d({ id: '10', ts: 1 }),
            d({ path: '1' }),
            d({ id: '8', inst: 1 }),
            d({ id: '8', ts: 3 }),
            d({ id: '9', ts: 2, inst: 1 }),
            d({ id: '6', fw: 'outdated', inst: 1 }),
            d({ path: '2' }),
            d({ id: '6', fw: 'outdated' }),
            d({ id: '4', mode: 'bootloader' }),
            d({ id: '5', mode: 'seedless' }),
            d({ id: '7', fw: 'required' }),
            d({ id: '10', inst: 2 }),
            d({ id: '10', inst: 1 }),
            d({ id: '3' }),
        ],
        result: [
            d({ path: '1' }),
            d({ path: '2' }),
            d({ id: '4', mode: 'bootloader' }),
            d({ id: '5', mode: 'seedless' }),
            d({ id: '6', fw: 'outdated' }),
            d({ id: '7', fw: 'required' }),
            d({ id: '8', ts: 3 }),
            d({ id: '9', ts: 2, inst: 1 }),
            d({ id: '10', ts: 1 }),
            d({ id: '3' }),
        ],
    },
];

const getDeviceInstances = [
    {
        description: 'Selected is unacquired',
        selected: d({ path: '1' }),
        devices: [d({ path: '1' })],
        result: [],
    },
    {
        description: 'Selected is undefined',
        selected: undefined,
        devices: [d({ path: '1' })],
        result: [],
    },
    {
        description: 'Selected without device_id (bootloader)',
        selected: { features: {} },
        devices: [d({ path: '1' })],
        result: [],
    },
    {
        description: 'Selected is a base device',
        selected: d({ id: '1' }),
        devices: [d({ id: '1', inst: 2 }), d({ id: '1', inst: 1 }), d({ id: '1' })],
        result: [d({ id: '1' }), d({ id: '1', inst: 1 }), d({ id: '1', inst: 2 })],
    },
    {
        description: 'Selected is an excluded base device',
        selected: d({ id: '1' }),
        devices: [d({ id: '1', inst: 2 }), d({ id: '1', inst: 1 }), d({ id: '1' })],
        excluded: true,
        result: [d({ id: '1', inst: 1 }), d({ id: '1', inst: 2 })],
    },
    {
        description: 'Selected is an excluded instance',
        selected: d({ id: '1', inst: 2 }),
        devices: [
            d({ id: '1' }),
            d({ id: '1', inst: 2 }),
            d({ id: '1', inst: 1 }),
            d({ id: '1', inst: 4 }),
            d({ id: '1', inst: 3 }),
        ],
        excluded: true,
        result: [
            d({ id: '1' }),
            d({ id: '1', inst: 1 }),
            d({ id: '1', inst: 3 }),
            d({ id: '1', inst: 4 }),
        ],
    },
    {
        description: 'Selected is an instance (with base placed at the end)',
        selected: d({ id: '1', inst: 2 }),
        devices: [
            d({ id: '1', inst: 2 }),
            d({ id: '1', inst: 1 }),
            d({ id: '1', inst: 4 }),
            d({ id: '1', inst: 3 }),
            d({ id: '1' }),
        ],
        result: [
            d({ id: '1' }),
            d({ id: '1', inst: 1 }),
            d({ id: '1', inst: 2 }),
            d({ id: '1', inst: 3 }),
            d({ id: '1', inst: 4 }),
        ],
    },
];

const getChangelogUrl = [
    {
        description: 'Revision set, core firmware',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T3B1,
            },
        } as TrezorDevice,
        revision: 'ab12cd',
        result: 'https://github.com/trezor/trezor-firmware/blob/ab12cd/core/CHANGELOG.T3B1.md',
    },
    {
        description: 'Missing revision, master/legacy firmware',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T1B1,
            },
        } as TrezorDevice,
        result: 'https://github.com/trezor/trezor-firmware/blob/main/legacy/firmware/CHANGELOG.md',
    },
    {
        description: 'Missing revision, core firmware',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T2T1,
            },
        } as TrezorDevice,
        result: 'https://github.com/trezor/trezor-firmware/blob/main/core/CHANGELOG.T2T1.md',
    },
];

const getCheckBackupUrl = [
    {
        description: 'Missing device',
        device: undefined,
        result: undefined,
    },
    {
        description: 'Device set',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T3B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_DRY_RUN_${DeviceModelInternal.T3B1}_URL`],
    },
];

const getPackagingUrl = [
    {
        description: 'Missing device',
        device: undefined,
        result: '',
    },
    {
        description: 'Device set',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T3B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_PACKAGING_${DeviceModelInternal.T3B1}_URL`],
    },
];

const getFirmwareDowngradeUrl = [
    {
        description: 'Missing device',
        device: undefined,
        result: undefined,
    },
    {
        description: 'Device set',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T3B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_FW_DOWNGRADE_${DeviceModelInternal.T3B1}_URL`],
    },
];

export default {
    getStatus,
    getIsDeviceDescriptorApiTypeBluetooth,
    getIsDeviceConnectedViaBluetooth,
    isSelectedDevice,
    isSelectedInstance,
    getNewInstanceNumber,
    getNewWalletNumber,
    findInstanceIndex,
    getSelectedDevice,
    sortByTimestamp,
    getFirstDeviceInstance,
    getDeviceInstances,
    isDeviceRemembered,
    getChangelogUrl,
    getCheckBackupUrl,
    getPackagingUrl,
    getFirmwareDowngradeUrl,
};
