import { testMocks } from '@suite-common/test-utils';
import type { TrezorDevice } from 'src/types/suite';
import { DeviceModelInternal, type FirmwareRelease } from '@trezor/connect';
import * as URLS from '@trezor/urls';

const { getSuiteDevice } = testMocks;

const SUITE_DEVICE = getSuiteDevice();
const connected = { connected: true, available: true };

const getStatus = [
    {
        device: SUITE_DEVICE,
        status: 'disconnected',
    },
    {
        device: getSuiteDevice({ connected: true, available: false }),
        status: 'unavailable',
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'bootloader' }),
        status: 'bootloader',
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'initialize' }),
        status: 'initialize',
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'seedless' }),
        status: 'seedless',
    },
    {
        device: getSuiteDevice({ ...connected, firmware: 'required' }),
        status: 'firmware-required',
    },
    {
        device: getSuiteDevice({ ...connected, status: 'occupied' }),
        status: 'used-in-other-window',
    },
    {
        device: getSuiteDevice({ ...connected, status: 'used' }),
        status: 'was-used-in-other-window',
    },
    {
        device: getSuiteDevice({ ...connected, firmware: 'outdated' }),
        status: 'firmware-recommended',
    },
    {
        device: getSuiteDevice(connected),
        status: 'connected',
    },
    {
        device: getSuiteDevice({ type: 'unacquired' }),
        status: 'unacquired',
    },
    {
        device: getSuiteDevice({ type: 'unreadable' }),
        status: 'unreadable',
    },
    {
        // @ts-expect-error: invalid type
        device: getSuiteDevice({ type: 'unknown' }),
        status: 'unknown',
    },
];

const isDeviceAccessible = [
    {
        description: `Device is accessible`,
        device: SUITE_DEVICE,
        result: true,
    },
    {
        description: `Device is not accessible (seedless mode)`,
        device: getSuiteDevice({ mode: 'seedless' }),
        result: false,
    },
    {
        description: `Device is not accessible (firmware required)`,
        device: getSuiteDevice({ firmware: 'required' }),
        result: false,
    },
    {
        description: `Device is not accessible (no features)`,
        device: getSuiteDevice({ type: 'unacquired' }),
        result: false,
    },
    {
        description: `Device is not accessible (no device)`,
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
        selected: getSuiteDevice({ type: 'unacquired' }),
        device: SUITE_DEVICE,
        result: false,
    },
    {
        description: `Device is not selected (device is unacquired)`,
        selected: SUITE_DEVICE,
        device: getSuiteDevice({ type: 'unacquired' }),
        result: false,
    },
    {
        description: `Device is not selected (device_id is different)`,
        selected: SUITE_DEVICE,
        device: getSuiteDevice(undefined, { device_id: 'different' }),
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
        device: getSuiteDevice(undefined, { device_id: 'different' }),
        result: false,
    },
    {
        description: `Device instance is not selected (instance is different)`,
        selected: SUITE_DEVICE,
        device: getSuiteDevice({ instance: 1 }),
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
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        device: SUITE_DEVICE,
        result: 2,
    },
    {
        description: `odd instances`,
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 1 }), getSuiteDevice({ instance: 4 })],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `odd mixed unsorted instances`,
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 4 }), getSuiteDevice({ instance: 1 })],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `device not found in state`,
        state: [
            getSuiteDevice(undefined, {
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
        state: [SUITE_DEVICE, getSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false })],
        device: SUITE_DEVICE,
        result: 2,
    },
    {
        description: `odd instances`,
        state: [
            SUITE_DEVICE,
            getSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
            getSuiteDevice({ walletNumber: 4, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `odd mixed unsorted instances`,
        state: [
            SUITE_DEVICE,
            getSuiteDevice({ walletNumber: 4, useEmptyPassphrase: false }),
            getSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 5,
    },
    {
        description: `standard wallet id skipped`,
        state: [
            SUITE_DEVICE,
            getSuiteDevice({ walletNumber: 1, useEmptyPassphrase: false }),
            getSuiteDevice({ walletNumber: undefined, useEmptyPassphrase: true }),
            getSuiteDevice({ walletNumber: 3, useEmptyPassphrase: false }),
        ],
        device: SUITE_DEVICE,
        result: 4,
    },
    {
        description: `device not found in state`,
        state: [
            getSuiteDevice(undefined, {
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
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        device: getSuiteDevice({ instance: 1 }),
        result: 1,
    },
    {
        description: `get second from mixed instances`,
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 4 }), getSuiteDevice({ instance: 1 })],
        device: getSuiteDevice({ instance: 4 }),
        result: 1,
    },
    {
        description: `unknown instance (not found)`,
        state: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        device: getSuiteDevice({ instance: 2 }),
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
            getSuiteDevice(undefined, {
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
        device: getSuiteDevice({ type: 'unacquired' }),
        state: [getSuiteDevice({ type: 'unacquired' })],
        result: getSuiteDevice({ type: 'unacquired' }),
    },
    {
        description: `bootloader device`,
        device: getSuiteDevice({ mode: 'bootloader' }),
        state: [getSuiteDevice({ mode: 'bootloader' })],
        result: getSuiteDevice({ mode: 'bootloader' }),
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
            getSuiteDevice(undefined, {
                device_id: 'ignored-device-id',
            }),
        ],
        result: undefined,
    },
    {
        description: `identical device, but with different device_id because of preceding device-wipe call`,
        device: getSuiteDevice({ path: '1' }, { device_id: '2' }),
        state: [getSuiteDevice({ path: '1' }, { device_id: '3' })],
        result: getSuiteDevice({ path: '1' }, { device_id: '3' }),
    },
];

const sortByTimestamp = {
    devices: [{ id: 1, ts: 1 }, { id: 2 }, { id: 3 }, { id: 5, ts: 3 }, { id: 4, ts: 2 }],
    result: [{ id: 5, ts: 3 }, { id: 4, ts: 2 }, { id: 1, ts: 1 }, { id: 2 }, { id: 3 }],
};

const isDeviceRemembered = [
    {
        description: 'acquired non remembered device',
        device: getSuiteDevice({ type: 'acquired', remember: true }),
        result: true,
    },
    {
        description: 'acquired remembered device',
        device: getSuiteDevice({ type: 'acquired', remember: false }),
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
    forceRemember: !!obj.forceRemember,
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
            d({ id: '3', forceRemember: true }),
        ],
        result: [
            d({ path: '1' }),
            d({ path: '2' }),
            d({ id: '3', forceRemember: true }),
            d({ id: '4', mode: 'bootloader' }),
            d({ id: '5', mode: 'seedless' }),
            d({ id: '6', fw: 'outdated' }),
            d({ id: '7', fw: 'required' }),
            d({ id: '8', ts: 3 }),
            d({ id: '9', ts: 2, inst: 1 }),
            d({ id: '10', ts: 1 }),
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

const parseFirmwareChangelog = [
    {
        description: 'Parse release changelog',
        release: {
            required: false,
            version: [1, 9, 4],
            bootloader_version: [1, 8, 0],
            min_bridge_version: [2, 0, 25],
            min_firmware_version: [1, 6, 2],
            min_bootloader_version: [1, 5, 0],
            url: 'firmware/1/trezor-1.9.4.bin',
            url_bitcoinonly: 'firmware/1/trezor-1.9.4-bitcoinonly.bin',
            fingerprint: '867017bd784cc4e9ce6f0875c61ea86f89b19380d54045c34608b85472998000',
            fingerprint_bitcoinonly:
                '3f73dfbcfc48f66c8814f6562524d81888230e0acd1c19b52b6e8772c6c67e7f',
            notes: 'https://blog.trezor.io/trezor-suite-and-firmware-updates-rbf-and-spending-now-live-c2f69c42d7f7',
            changelog:
                '* Replacement transaction signing for replace-by-fee.\n* Support for Output Descriptors export.\n* Show Ypub/Zpub correctly for multisig GetAddress.\n* Show amounts in mBTC, uBTC and sat denominations.',
        } as FirmwareRelease,
        result: {
            changelog: [
                'Replacement transaction signing for replace-by-fee.',
                'Support for Output Descriptors export.',
                'Show Ypub/Zpub correctly for multisig GetAddress.',
                'Show amounts in mBTC, uBTC and sat denominations.',
            ],
            notes: 'https://blog.trezor.io/trezor-suite-and-firmware-updates-rbf-and-spending-now-live-c2f69c42d7f7',
            url: 'firmware/1/trezor-1.9.4.bin',
            versionString: '1.9.4',
        },
    },
    {
        description: 'No firmware release',
        result: null,
    },
];

const getChangelogUrl = [
    {
        description: 'Revision set, core firmware',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T2B1,
            },
        } as TrezorDevice,
        revision: 'ab12cd',
        result: 'https://github.com/trezor/trezor-firmware/blob/ab12cd/core/CHANGELOG.T2B1.md',
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
        result: '',
    },
    {
        description: 'Device set',
        device: {
            ...SUITE_DEVICE,
            features: {
                internal_model: DeviceModelInternal.T2B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_DRY_RUN_${DeviceModelInternal.T2B1}_URL`],
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
                internal_model: DeviceModelInternal.T2B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_PACKAGING_${DeviceModelInternal.T2B1}_URL`],
    },
];

const getFirmwareDowngradeUrl = [
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
                internal_model: DeviceModelInternal.T2B1,
            },
        } as TrezorDevice,
        result: URLS[`HELP_CENTER_FW_DOWNGRADE_${DeviceModelInternal.T2B1}_URL`],
    },
];

export default {
    getStatus,
    isDeviceAccessible,
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
    parseFirmwareChangelog,
    getChangelogUrl,
    getCheckBackupUrl,
    getPackagingUrl,
    getFirmwareDowngradeUrl,
};
