/* eslint-disable @typescript-eslint/camelcase */
import colors from '@trezor/components/lib/config/colors'; // TODO: fix this import, jest fails on svg parsing
import l10nMessages from '@suite-components/DeviceMenu/index.messages';

const { getSuiteDevice } = global.JestMocks;

const SUITE_DEVICE = getSuiteDevice();
const connected = { connected: true, available: true };
const TRANSPORT = {
    type: 'bridge',
    bridge: {
        version: [1, 0, 0],
        directory: '',
        packages: [{ platform: '', name: '', url: '' }],
        changelog: '',
    },
};

const getStatus = [
    {
        device: SUITE_DEVICE,
        status: 'disconnected',
        name: l10nMessages.TR_DISCONNECTED.defaultMessage,
        color: colors.ERROR_PRIMARY,
    },
    {
        device: getSuiteDevice({ connected: true, available: false }),
        status: 'unavailable',
        name: l10nMessages.TR_UNAVAILABLE.defaultMessage,
        color: colors.ERROR_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'bootloader' }),
        status: 'bootloader',
        name: l10nMessages.TR_CONNECTED_BOOTLOADER.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'initialize' }),
        status: 'initialize',
        name: l10nMessages.TR_CONNECTED_NOT_INITIALIZED.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, mode: 'seedless' }),
        status: 'seedless',
        name: l10nMessages.TR_CONNECTED_SEEDLESS.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, firmware: 'required' }),
        status: 'firmware-required',
        name: l10nMessages.TR_CONNECTED_UPDATE_REQUIRED.defaultMessage,
        color: colors.ERROR_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, status: 'occupied' }),
        status: 'used-in-other-window',
        name: l10nMessages.TR_USED_IN_ANOTHER_WINDOW.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, status: 'used' }),
        status: 'was-used-in-other-window',
        name: l10nMessages.TR_WAS_USED_IN_ANOTHER_WINDOW.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ ...connected, firmware: 'outdated' }),
        status: 'firmware-recommended',
        name: l10nMessages.TR_CONNECTED_UPDATE_RECOMMENDED.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice(connected),
        status: 'connected',
        name: l10nMessages.TR_CONNECTED.defaultMessage,
        color: colors.GREEN_PRIMARY,
    },
    {
        device: getSuiteDevice({ type: 'unacquired' }),
        status: 'unacquired',
        name: l10nMessages.TR_USED_IN_ANOTHER_WINDOW.defaultMessage,
        color: colors.WARNING_PRIMARY,
    },
    {
        device: getSuiteDevice({ type: 'unreadable' }),
        status: 'unreadable',
        name: l10nMessages.TR_UNREADABLE.defaultMessage,
        color: colors.ERROR_PRIMARY,
    },
    {
        // @ts-ignore: invalid type
        device: getSuiteDevice({ type: 'unknown' }),
        status: 'unknown',
        name: l10nMessages.TR_STATUS_UNKNOWN.defaultMessage,
        color: colors.TEXT_PRIMARY,
    },
];

const isWebUSB = [
    {
        description: `Transport is webusb`,
        transport: {
            ...TRANSPORT,
            type: 'webusb',
        },
        result: true,
    },
    {
        description: `Transport is not webusb (bridge)`,
        transport: TRANSPORT,
        result: false,
    },
    {
        description: `Transport is not webusb (not defined)`,
        transport: undefined,
        result: false,
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
        description: `Device is not selected (device path is different)`,
        selected: SUITE_DEVICE,
        device: getSuiteDevice({ path: '1' }),
        result: false,
    },
    {
        description: `Device is not selected (device instance is different)`,
        selected: SUITE_DEVICE,
        device: getSuiteDevice({ instance: 1 }),
        result: false,
    },
];

const getVersion = [
    {
        description: `model T`,
        device: SUITE_DEVICE,
        result: 'T',
    },
    {
        description: `model One`,
        device: getSuiteDevice(undefined, { major_version: 1 }),
        result: 'One',
    },
    {
        description: `model One (no features)`,
        device: getSuiteDevice({ type: 'unacquired' }),
        result: 'One',
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
];

export default {
    getStatus,
    isWebUSB,
    isDeviceAccessible,
    isSelectedDevice,
    getVersion,
    getNewInstanceNumber,
    findInstanceIndex,
    getSelectedDevice,
};
