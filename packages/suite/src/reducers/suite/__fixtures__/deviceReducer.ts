import { TrezorDevice } from '@suite-common/suite-types';
import { testMocks } from '@suite-common/test-utils';
import {
    ConnectDeviceSettings,
    authorizeDeviceThunk,
    deviceActions,
} from '@suite-common/wallet-core';
import { DEVICE } from '@trezor/connect';
import { DeepPartial } from '@trezor/type-utils';

const { getConnectDevice, getSuiteDevice } = testMocks;

// Default devices
const CONNECT_DEVICE = getConnectDevice();
const SUITE_DEVICE = getSuiteDevice();

type Fixture<TAction> = {
    description: string;
    actions: TAction[];
    initialState: any;
    result: DeepPartial<TrezorDevice>[];
};

const SUITE_SETTINGS: ConnectDeviceSettings = {
    defaultWalletLoading: 'standard',
};

const connect: Fixture<
    | ReturnType<typeof deviceActions.connectDevice>
    | ReturnType<typeof deviceActions.connectUnacquiredDevice>
>[] = [
    {
        description: 'Connect device (0 connected, 0 affected)',
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        type: 'unacquired',
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: {
                    device: getConnectDevice({
                        type: 'unacquired',
                        path: '1',
                    }),
                    settings: {
                        defaultWalletLoading: 'standard',
                    },
                },
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
                payload: getSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
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
                payload: SUITE_DEVICE,
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
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
                    state: '1stTestnet@device_id:0',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [
            {
                path: '',
                connected: false,
                available: false,
                state: '1stTestnet@device_id:0',
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
                    state: '1stTestnet@device_id:0',
                }),
                getSuiteDevice({
                    path: '1',
                    remember: true,
                    instance: 1,
                    state: '1stTestnet@device_id_2:0',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: getSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [
            {
                path: '',
                instance: undefined,
                connected: false,
                available: false,
                state: '1stTestnet@device_id:0',
            },
            {
                path: '',
                instance: 1,
                connected: false,
                available: false,
                state: '1stTestnet@device_id_2:0',
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
                payload: getSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
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
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [],
    },
    {
        description: `Disconnect device which doesn't exists in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: SUITE_DEVICE,
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [],
    },
];

const changed: Fixture<ReturnType<typeof deviceActions.deviceChanged>>[] = [
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

const updateTimestamp: Array<
    Fixture<ReturnType<typeof deviceActions.selectDevice>> & {
        ts: number[];
    }
> = [
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
                payload: undefined,
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

const changePassphraseMode: Fixture<ReturnType<typeof deviceActions.updatePassphraseMode>>[] = [
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
                    device: {
                        ...getSuiteDevice({
                            type: 'unacquired',
                        }),
                        useEmptyPassphrase: false,
                        connected: true,
                        available: true,
                        ts: 1,
                        buttonRequests: [],
                        metadata: {},
                        passwords: {},
                    },
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

// Todo: this is not working, dunno why: Fixture<ReturnType<typeof authorizeDeviceThunk.fulfilled>>[]
const authDevice = [
    {
        description: `Auth device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: authorizeDeviceThunk.fulfilled.type,
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
                type: authorizeDeviceThunk.fulfilled.type,
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
                type: authorizeDeviceThunk.fulfilled.type,
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
                type: authorizeDeviceThunk.fulfilled.type,
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
                type: authorizeDeviceThunk.fulfilled.type,
                payload: {
                    device: SUITE_DEVICE,
                    state: 'A',
                },
            },
        ],
        result: [],
    },
];

const forget: Fixture<ReturnType<typeof deviceActions.forgetDevice>>[] = [
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
                getSuiteDevice({
                    state: '1stTestnetAddress@device_id:3',
                    connected: true,
                    instance: 3,
                }),
                SUITE_DEVICE,
                getSuiteDevice({ instance: 1 }),
            ],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: getSuiteDevice({ instance: 1 }),
                    settings: SUITE_SETTINGS,
                },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE, settings: SUITE_SETTINGS },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: getSuiteDevice({ connected: true, instance: 3 }),
                    settings: SUITE_SETTINGS,
                },
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
                payload: { device: getSuiteDevice({ instance: 3 }), settings: SUITE_SETTINGS },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: getSuiteDevice(undefined, {
                        device_id: 'ignored-device-id',
                    }),
                    settings: SUITE_SETTINGS,
                },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE, settings: SUITE_SETTINGS },
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
                payload: {
                    device: getSuiteDevice({
                        type: 'unacquired',
                    }),
                    settings: SUITE_SETTINGS,
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
        description: `instance doesn't exist in reducer`,
        initialState: { devices: [] },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE, settings: SUITE_SETTINGS },
            },
        ],
        result: [],
    },
];

const remember: Fixture<ReturnType<typeof deviceActions.rememberDevice>>[] = [
    {
        description: `Remember unacquired device`,
        initialState: { devices: [SUITE_DEVICE] },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({ type: 'unacquired' }),
                    remember: false,
                    forceRemember: undefined,
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
                    forceRemember: undefined,
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
                    state: '1stTestnet@device_id:0',
                }),
            ],
        },
        actions: [
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({
                        state: '1stTestnet@device_id:0',
                    }),
                    remember: true,
                    forceRemember: undefined,
                },
            },
        ],
        result: [
            getSuiteDevice({
                state: '1stTestnet@device_id:0',
                remember: true,
            }),
        ],
    },
    {
        description: `Remember device with multiple instances (few are stateless)`,
        initialState: {
            devices: [
                getSuiteDevice({
                    state: '1stTestnet@device_id:0',
                }),
                getSuiteDevice({
                    state: '1stTestnet@device_id:0',
                    instance: 1,
                }),
                getSuiteDevice({
                    instance: 2,
                }),
                getSuiteDevice({
                    state: '1stTestnet@device_id:0',
                    instance: 3,
                }),
                getSuiteDevice(
                    {
                        state: '1stTestnet@device_id:0',
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
                        state: '1stTestnet@device_id:0',
                    }),
                    remember: true,
                    forceRemember: undefined,
                },
            },
            {
                type: deviceActions.rememberDevice.type,
                payload: {
                    device: getSuiteDevice({
                        state: '1stTestnet@device_id:0',
                        instance: 3,
                    }),
                    remember: true,
                    forceRemember: undefined,
                },
            },
        ],
        result: [
            getSuiteDevice({
                state: '1stTestnet@device_id:0',
                remember: true,
            }),
            getSuiteDevice({
                state: '1stTestnet@device_id:0',
                instance: 1,
                remember: false,
            }),
            getSuiteDevice({
                instance: 2,
            }),
            getSuiteDevice({
                state: '1stTestnet@device_id:0',
                instance: 3,
                remember: true,
            }),
            getSuiteDevice(
                {
                    state: '1stTestnet@device_id:0',
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
    forget,
    remember,
};
