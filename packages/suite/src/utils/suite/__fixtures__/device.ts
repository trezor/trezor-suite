/* eslint-disable @typescript-eslint/naming-convention */

const { getSuiteDevice } = global.JestMocks;

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
        // @ts-ignore: invalid type
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
            d({ id: '9', ts: 1 }),
            d({ path: '1' }),
            d({ id: '7', inst: 1 }),
            d({ id: '7', ts: 3 }),
            d({ id: '8', ts: 2, inst: 1 }),
            d({ id: '5', fw: 'outdated', inst: 1 }),
            d({ path: '2' }),
            d({ id: '5', fw: 'outdated' }),
            d({ id: '3', mode: 'bootloader' }),
            d({ id: '4', mode: 'seedless' }),
            d({ id: '6', fw: 'required' }),
            d({ id: '9', inst: 2 }),
            d({ id: '9', inst: 1 }),
        ],
        result: [
            d({ path: '1' }),
            d({ path: '2' }),
            d({ id: '3', mode: 'bootloader' }),
            d({ id: '4', mode: 'seedless' }),
            d({ id: '5', fw: 'outdated' }),
            d({ id: '6', fw: 'required' }),
            d({ id: '7', ts: 3 }),
            d({ id: '8', ts: 2, inst: 1 }),
            d({ id: '9', ts: 1 }),
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

export default {
    getStatus,
    isDeviceAccessible,
    isSelectedDevice,
    isSelectedInstance,
    getVersion,
    getNewInstanceNumber,
    findInstanceIndex,
    getSelectedDevice,
    sortByTimestamp,
    getFirstDeviceInstance,
    getDeviceInstances,
    isDeviceRemembered,
};
