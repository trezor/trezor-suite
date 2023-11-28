import { testMocks } from '@suite-common/test-utils';
import { deviceActions } from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';

const { getConnectDevice, getSuiteDevice } = testMocks;

// Default devices
const CONNECT_DEVICE = getConnectDevice();
const SUITE_DEVICE = getSuiteDevice();

const connect = [
    {
        description: 'Connect device (0 connected, 0 affected)',
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '1',
                connected: true,
            },
        ],
    },
    {
        description: 'Connect device (1 connected, 0 affected)',
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '',
                connected: false,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                path: '1',
                connected: true,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: 'Connect device (1 connected, 1 affected)',
        initialState: {
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '1',
                connected: true,
            },
        ],
    },
    {
        description: 'Connect device (1 connected, 2 instances, 2 affected)',
        initialState: {
            devices: [
                getSuiteDevice({
                    instance: 1,
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '1',
                instance: 1,
                connected: true,
            },
            {
                path: '1',
                instance: undefined,
                connected: true,
            },
        ],
    },
    {
        description: 'Connect device (2 connected, 1 affected)',
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                connected: false,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                path: '1',
                connected: true,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: 'Connect acquired device and replace unacquired',
        initialState: {
            devices: [
                getSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                type: 'acquired',
                path: '1',
                connected: true,
            },
        ],
    },
    {
        description:
            'Connect device with different "passphrase_protection" (create new missing instance)',
        initialState: {
            devices: [
                getSuiteDevice(
                    {
                        useEmptyPassphrase: false,
                        instance: 1,
                    },
                    {
                        passphrase_protection: true,
                    },
                ),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                type: 'acquired',
                path: '1',
                connected: true,
                available: false,
                instance: 1,
                features: {
                    passphrase_protection: false,
                },
            },
            {
                type: 'acquired',
                path: '1',
                instance: undefined,
                connected: true,
                available: true,
                features: {
                    passphrase_protection: false,
                },
            },
        ],
    },
    {
        description: 'Connect unacquired device',
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.CONNECT_UNACQUIRED,
                payload: getConnectDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            },
        ],
        result: [
            {
                type: 'unacquired',
                path: '1',
            },
        ],
    },
    {
        description: 'Connect unacquired device which already exists in reducer',
        initialState: {
            devices: [
                getSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT_UNACQUIRED,
                payload: getConnectDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            },
        ],
        result: [
            {
                type: 'unacquired',
                path: '1',
            },
        ],
    },
];

const disconnect = [
    {
        description: 'Disconnect device using path',
        initialState: {
            devices: [
                getSuiteDevice({
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [],
    },
    {
        description: 'Disconnect device using device_id',
        initialState: {
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: [],
    },
    {
        description: 'Disconnect remembered device',
        initialState: {
            devices: [
                getSuiteDevice({
                    path: '1',
                    remember: true,
                    state: 'abc',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '',
                connected: false,
                available: false,
                state: 'abc',
            },
        ],
    },
    {
        description: 'Disconnect remembered device (2 instances)',
        initialState: {
            devices: [
                getSuiteDevice({
                    path: '1',
                    remember: true,
                    state: 'abc',
                }),
                getSuiteDevice({
                    path: '1',
                    remember: true,
                    instance: 1,
                    state: 'cba',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '',
                instance: undefined,
                connected: false,
                available: false,
                state: 'abc',
            },
            {
                path: '',
                instance: 1,
                connected: false,
                available: false,
                state: 'cba',
            },
        ],
    },
    {
        description: 'Disconnect device (2 connected, 1 affected)',
        initialState: {
            devices: [
                getSuiteDevice(
                    {
                        path: '2',
                        connected: true,
                    },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                getSuiteDevice({
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getConnectDevice({
                    path: '1',
                }),
            },
        ],
        result: [
            {
                path: '2',
                connected: true,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
        ],
    },
    {
        description: `Disconnect unacquired device`,
        initialState: {
            devices: [
                getSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            },
        ],
        result: [],
    },
    {
        description: `Disconnect device which doesn't exists in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: [],
    },
];

const changed = [
    {
        description: `Change status available > occupied (using path)`,
        initialState: {
            devices: [
                getSuiteDevice(
                    {
                        path: '1',
                        connected: true,
                    },
                    {
                        device_id: null,
                    },
                ),
            ],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: getConnectDevice(
                    {
                        path: '1',
                        status: 'occupied',
                    },
                    {
                        device_id: 'different-device-id',
                    },
                ),
            },
        ],
        result: [
            {
                status: 'occupied',
                features: {
                    device_id: 'different-device-id',
                },
            },
        ],
    },
    {
        description: `Change unacquired device`,
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: getConnectDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            },
        ],
        result: [],
    },
    {
        description: `Change device (2 connected, 1 affected)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                getSuiteDevice({ connected: true }),
            ],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: getConnectDevice({
                    status: 'occupied',
                }),
            },
        ],
        result: [
            {
                status: 'available',
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                status: 'occupied',
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `Change device with on device with different "passphrase_protection" (shouldn't be changed)`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: getConnectDevice(
                    {
                        status: 'occupied',
                    },
                    {
                        passphrase_protection: true,
                    },
                ),
            },
        ],
        result: [
            {
                status: 'available',
                features: {
                    passphrase_protection: false,
                },
            },
        ],
    },
    {
        description: `Change device which doesn't exists in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: CONNECT_DEVICE,
            },
        ],
        result: [],
    },
    {
        description: `features are not overridden when device is locked`,
        initialState: {
            devices: [
                getSuiteDevice(
                    // Reducer doesn't try to merge non-connected devices.
                    // Set `connected` to `true` to overcome that.
                    { connected: true },
                    { safety_checks: 'Strict', unlocked: true },
                ),
            ],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: getConnectDevice(undefined, {
                    unlocked: false,
                    safety_checks: null,
                }),
            },
        ],
        result: [
            getSuiteDevice(
                // Account for the reducer marking device as available when it's locked (or isn't passphrase protected).
                { connected: true, available: true },
                { safety_checks: 'Strict', unlocked: false },
            ),
        ],
    },
];

const updateTimestamp = [
    {
        description: `Select device (1 connected, 1 affected)`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: SUITE_DEVICE,
            },
        ],
        result: [
            {
                features: {
                    passphrase_protection: false,
                },
            },
        ],
        ts: [1],
    },
    {
        description: `Select device (2 connected, 1 affected)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: SUITE_DEVICE,
            },
        ],
        result: [
            {
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                features: {
                    device_id: 'device-id',
                },
            },
        ],
        ts: [0, 1],
    },
    {
        description: `Select device instance (2 instances, 1 affected)`,
        initialState: {
            devices: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: getSuiteDevice({ instance: 1 }),
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
        ts: [0, 1],
    },
    {
        description: `Select first then second instance (2 instances, 2 affected)`,
        initialState: {
            devices: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: SUITE_DEVICE,
            },
            {
                type: deviceActions.selectDevice.type,
                payload: getSuiteDevice({ instance: 1 }),
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
        ts: [1, 1],
    },
    {
        description: `Select device (0 connected, 0 affected)`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.selectDevice.type,
            },
        ],
        result: [],
        ts: [],
    },
    {
        description: `Select device which doesn't exist in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: SUITE_DEVICE,
            },
        ],
        result: [],
        ts: [],
    },
];

const changePassphraseMode = [
    {
        description: `Receive passphrase mode: true > false`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.updatePassphraseMode.type,
                payload: {
                    hidden: true,
                    device: SUITE_DEVICE,
                },
            },
        ],
        result: [
            {
                useEmptyPassphrase: false,
            },
        ],
    },
    {
        description: `Receive passphrase mode (2 connected, 1 affected)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: deviceActions.updatePassphraseMode.type,
                payload: {
                    device: SUITE_DEVICE,
                    hidden: true,
                },
            },
        ],
        result: [
            {
                useEmptyPassphrase: true,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                useEmptyPassphrase: false,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `Update passphrase mode (2 instances, 1 affected)`,
        initialState: {
            devices: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.updatePassphraseMode.type,
                payload: {
                    device: getSuiteDevice({ instance: 1 }),
                    hidden: true,
                },
            },
        ],
        result: [
            {
                instance: undefined,
                useEmptyPassphrase: true,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                useEmptyPassphrase: false,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `device is unacquired`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.updatePassphraseMode.type,
                payload: {
                    device: getConnectDevice({
                        type: 'unacquired',
                    }),
                    hidden: false,
                },
            },
        ],
        result: [
            {
                useEmptyPassphrase: true,
            },
        ],
    },
    {
        description: `device doesn't exist in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.updatePassphraseMode.type,
                payload: {
                    hidden: false,
                    device: SUITE_DEVICE,
                },
            },
        ],
        result: [],
    },
];

const authDevice = [
    {
        description: `Auth device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.authDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    state: 'A',
                },
            },
        ],
        result: [
            {
                state: 'A',
            },
        ],
    },
    {
        description: `Auth device (2 connected, 1 affected)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: deviceActions.authDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    state: 'A',
                },
            },
        ],
        result: [
            {
                state: undefined,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                state: 'A',
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `Auth device (2 instances, 1 affected)`,
        initialState: {
            devices: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.authDevice.type,
                payload: {
                    device: getSuiteDevice({ instance: 1 }),
                    state: 'A',
                },
            },
        ],
        result: [
            {
                instance: undefined,
                state: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                state: 'A',
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `device is unacquired`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.authDevice.type,
                payload: {
                    device: getConnectDevice({
                        type: 'unacquired',
                    }),
                    state: 'A',
                },
            },
        ],
        result: [
            {
                state: undefined,
            },
        ],
    },
    {
        description: `device doesn't exist in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.authDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    state: 'A',
                },
            },
        ],
        result: [],
    },
];

const createInstance = [
    {
        description: `Create instance, 1 connected`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.createDeviceInstance.type,
                payload: getSuiteDevice({ useEmptyPassphrase: false, instance: 1 }),
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `Create instance, 2 connected, 1 affected`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: deviceActions.createDeviceInstance.type,
                payload: getSuiteDevice({ useEmptyPassphrase: false, instance: 1 }),
            },
        ],
        result: [
            {
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                instance: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `Create instance from instance`,
        initialState: {
            devices: [SUITE_DEVICE, getSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.createDeviceInstance.type,
                payload: getSuiteDevice({ useEmptyPassphrase: false, instance: 2 }),
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
            {
                instance: 2,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `device is unacquired`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.createDeviceInstance.type,
                payload: getSuiteDevice({
                    type: 'unacquired',
                }),
            },
        ],
        result: [
            {
                state: undefined,
            },
        ],
    },
];

const forget = [
    {
        description: `Forget multiple instances (2 connected, 5 instances, 3 affected, last instance remains with undefined state)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                getSuiteDevice(
                    { instance: 1 },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                getSuiteDevice({ state: 'state', connected: true, instance: 3 }),
                SUITE_DEVICE,
                getSuiteDevice({ instance: 1 }),
            ],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: getSuiteDevice({ instance: 1 }),
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: SUITE_DEVICE,
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: getSuiteDevice({ connected: true, instance: 3 }),
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                ...getSuiteDevice({ connected: true, instance: 3 }),
                state: undefined,
                useEmptyPassphrase: true,
            },
        ],
    },
    {
        description: `Forget three instances one by one (2 connected, 5 instances, 3 affected)`,
        initialState: {
            devices: [
                getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                getSuiteDevice(
                    { instance: 1 },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                SUITE_DEVICE,
                getSuiteDevice({ instance: 1 }),
                getSuiteDevice({ instance: 3 }),
            ],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: getSuiteDevice({ instance: 3 }),
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: getSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: SUITE_DEVICE,
            },
        ],
        result: [
            {
                instance: 1,
                features: {
                    device_id: 'ignored-device-id',
                },
            },
            {
                instance: 1,
                features: {
                    device_id: 'device-id',
                },
            },
        ],
    },
    {
        description: `device is unacquired`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: getSuiteDevice({
                    type: 'unacquired',
                }),
            },
        ],
        result: [
            {
                state: undefined,
            },
        ],
    },
    {
        description: `instance doesn't exist in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: SUITE_DEVICE,
            },
        ],
        result: [],
    },
];

const remember = [
    {
        description: `Remember undefined device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {},
            },
        ],
        result: [SUITE_DEVICE],
    },
    {
        description: `Remember unacquired device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({ type: 'unacquired' }),
                },
            },
        ],
        result: [SUITE_DEVICE],
    },
    {
        description: `Remember stateless device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    remember: true,
                },
            },
        ],
        result: [{ ...SUITE_DEVICE, remember: true }],
    },
    {
        description: `Force remember device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    remember: true,
                    forceRemember: true,
                },
            },
        ],
        result: [getSuiteDevice({ remember: true, forceRemember: true })],
    },
    {
        description: `Remember device success`,
        initialState: {
            devices: [
                getSuiteDevice({
                    state: 'abc',
                }),
            ],
        },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({
                        state: 'abc',
                    }),
                    remember: true,
                },
            },
        ],
        result: [
            getSuiteDevice({
                state: 'abc',
                remember: true,
            }),
        ],
    },
    {
        description: `Remember device with multiple instances (few are stateless)`,
        initialState: {
            devices: [
                getSuiteDevice({
                    state: 'abc',
                }),
                getSuiteDevice({
                    state: 'abc',
                    instance: 1,
                }),
                getSuiteDevice({
                    instance: 2,
                }),
                getSuiteDevice({
                    state: 'abc',
                    instance: 3,
                }),
                getSuiteDevice(
                    {
                        state: 'abc',
                        path: '2',
                    },
                    {
                        device_id: 'ignored-device',
                    },
                ),
            ],
        },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({
                        state: 'abc',
                    }),
                    remember: true,
                },
            },
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({
                        state: 'abc',
                        instance: 3,
                    }),
                    remember: true,
                },
            },
        ],
        result: [
            getSuiteDevice({
                state: 'abc',
                remember: true,
            }),
            getSuiteDevice({
                state: 'abc',
                instance: 1,
                remember: false,
            }),
            getSuiteDevice({
                instance: 2,
            }),
            getSuiteDevice({
                state: 'abc',
                instance: 3,
                remember: true,
            }),
            getSuiteDevice(
                {
                    state: 'abc',
                    path: '2',
                },
                {
                    device_id: 'ignored-device',
                },
            ),
        ],
    },
];

export default {
    connect,
    disconnect,
    changed,
    updateTimestamp,
    changePassphraseMode,
    authDevice,
    createInstance,
    forget,
    remember,
};
