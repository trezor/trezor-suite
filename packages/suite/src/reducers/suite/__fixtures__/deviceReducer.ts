import {
    type DeviceReducerState,
    deviceActions,
    deviceReducerInitialState,
} from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DEVICE } from '@trezor/connect';
import { type DeepPartial } from '@trezor/type-utils';

// Default devices
const CONNECT_DEVICE = mockConnectDevice();
const SUITE_DEVICE = mockSuiteDevice();

type Fixture<TAction> = {
    description: string;
    actions: TAction[];
    initialState: DeviceReducerState;
    result: DeepPartial<TrezorDevice>[];
};

const connect: Fixture<
    | ReturnType<typeof deviceActions.connectDevice>
    | ReturnType<typeof deviceActions.connectUnacquiredDevice>
>[] = [
    {
        description: 'Connect device (0 connected, 0 affected)',
        initialState: deviceReducerInitialState,
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    instance: 1,
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                SUITE_DEVICE,
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: {
                    device: mockConnectDevice({
                        path: '1',
                    }),
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
        description: 'Connect unacquired device',
        initialState: deviceReducerInitialState,
        actions: [
            {
                type: DEVICE.CONNECT_UNACQUIRED,
                payload: {
                    device: mockConnectDevice({
                        type: 'unacquired',
                        path: '1',
                    }),
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT_UNACQUIRED,
                payload: {
                    device: mockConnectDevice({
                        type: 'unacquired',
                        path: '1',
                    }),
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
        description: 'Connect unacquired device and replace remembered device',
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    type: 'acquired',
                    path: '1',
                    remember: true,
                    connected: false,
                    available: false,
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CONNECT_UNACQUIRED,
                payload: {
                    device: mockConnectDevice({
                        type: 'unacquired',
                        status: 'thp-locked',
                        path: '1',
                    }),
                },
            },
        ],
        result: [
            {
                type: 'acquired',
                status: 'thp-locked',
                path: '1',
                remember: true,
                connected: true,
                available: true,
            },
        ],
    },
];

const disconnect = [
    {
        description: 'Disconnect device using path',
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: mockSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [],
    },
    {
        description: 'Disconnect device using device_id',
        initialState: {
            ...deviceReducerInitialState,
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    path: '1',
                    remember: true,
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: mockSuiteDevice({
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [
            {
                path: '',
                connected: false,
                available: false,
                state: {
                    staticSessionId: '1stTestnet@device_id:0',
                },
            },
        ],
    },
    {
        description: 'Disconnect remembered device (2 instances)',
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    path: '1',
                    remember: true,
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                }),
                mockSuiteDevice({
                    path: '1',
                    remember: true,
                    instance: 1,
                    state: { staticSessionId: '1stTestnet@device_id_2:0' },
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: mockSuiteDevice({
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
                state: { staticSessionId: '1stTestnet@device_id:0' },
            },
            {
                path: '',
                instance: 1,
                connected: false,
                available: false,
                state: { staticSessionId: '1stTestnet@device_id_2:0' },
            },
        ],
    },
    {
        description: 'Disconnect device (2 connected, 1 affected)',
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(
                    {
                        path: '2',
                        connected: true,
                    },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                mockSuiteDevice({
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: mockSuiteDevice({
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: mockSuiteDevice({
                    type: 'unacquired',
                    path: '1',
                }),
            } satisfies ReturnType<typeof deviceActions.deviceDisconnect>,
        ],
        result: [],
    },
    {
        description: `Disconnect device which doesn't exists in reducer`,
        initialState: deviceReducerInitialState,
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(
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
                payload: mockConnectDevice(
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
        description: `Change unacquired (busy) THP device`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    type: 'unacquired',
                    path: '2',
                    status: 'busy',
                }),
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
            ],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: mockConnectDevice({
                    type: 'unacquired',
                    path: '2',
                    thp: {
                        properties: undefined,
                        channel: '00',
                        credentials: [],
                    },
                }),
            },
        ],
        result: [
            {
                status: undefined,
                thp: {
                    channel: '00',
                },
            },
            {
                status: 'available',
                features: {
                    device_id: 'ignored-device-id',
                },
            },
        ],
    },
    {
        description: `Change unacquired device`,
        initialState: deviceReducerInitialState,
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: mockConnectDevice({
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                mockSuiteDevice({ connected: true }),
            ],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: mockConnectDevice({
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
        initialState: {
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: DEVICE.CHANGED,
                payload: mockConnectDevice(
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
        initialState: deviceReducerInitialState,
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
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(
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
                payload: mockConnectDevice(undefined, {
                    unlocked: false,
                    safety_checks: null,
                }),
            },
        ],
        result: [
            mockSuiteDevice(
                // Account for the reducer marking device as available when it's locked (or isn't passphrase protected).
                { connected: true, available: true },
                { safety_checks: 'Strict', unlocked: false },
            ),
        ],
    },
];

const selectDevice: Array<
    Fixture<ReturnType<typeof deviceActions.selectDevice>> & {
        ts: number[];
    }
> = [
    {
        description: `Select device (1 connected, 1 affected)`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
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
                    passphrase_protection: false,
                },
            },
        ],
        ts: [1],
    },
    {
        description: `Select device (2 connected, 1 affected)`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
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
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: mockSuiteDevice({ instance: 1 }),
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
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE, mockSuiteDevice({ instance: 1 })],
        },
        actions: [
            {
                type: deviceActions.selectDevice.type,
                payload: SUITE_DEVICE,
            },
            {
                type: deviceActions.selectDevice.type,
                payload: mockSuiteDevice({ instance: 1 }),
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
        initialState: deviceReducerInitialState,
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
        initialState: deviceReducerInitialState,
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

const forget: Fixture<ReturnType<typeof deviceActions.forgetDevice>>[] = [
    {
        description: `Forget multiple instances (2 connected, 5 instances, 3 affected, last instance remains with undefined state)`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                mockSuiteDevice(
                    { instance: 1 },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                mockSuiteDevice({
                    state: { staticSessionId: '1stTestnetAddress@device_id:3' },
                    connected: true,
                    instance: 3,
                }),
                SUITE_DEVICE,
                mockSuiteDevice({ instance: 1 }),
            ],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: mockSuiteDevice({ instance: 1 }),
                },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: mockSuiteDevice({ connected: true, instance: 3 }),
                },
            },
        ],
        result: [
            {
                instance: undefined,
                features: {
                    device_id: 'ignored-device-id',
                },
                useEmptyPassphrase: undefined,
            },
            {
                instance: 1,
                features: {
                    device_id: 'ignored-device-id',
                },
                useEmptyPassphrase: undefined,
            },
            {
                ...mockSuiteDevice({ connected: true, instance: 3 }),
                state: undefined,
            },
        ],
    },
    {
        description: `Forget three instances one by one (2 connected, 5 instances, 3 affected)`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice(undefined, {
                    device_id: 'ignored-device-id',
                }),
                mockSuiteDevice(
                    { instance: 1 },
                    {
                        device_id: 'ignored-device-id',
                    },
                ),
                SUITE_DEVICE,
                mockSuiteDevice({ instance: 1 }),
                mockSuiteDevice({ instance: 3 }),
            ],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: mockSuiteDevice({ instance: 3 }) },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: mockSuiteDevice(undefined, {
                        device_id: 'ignored-device-id',
                    }),
                },
            },
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE },
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
        initialState: {
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: {
                    device: mockSuiteDevice({
                        type: 'unacquired',
                    }),
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
        initialState: deviceReducerInitialState,
        actions: [
            {
                type: deviceActions.forgetDevice.type,
                payload: { device: SUITE_DEVICE },
            },
        ],
        result: [],
    },
];

const remember: Fixture<ReturnType<typeof deviceActions.setRememberDevice>>[] = [
    {
        description: `Remember unacquired device`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: deviceActions.setRememberDevice.type,
                payload: {
                    device: mockSuiteDevice({ type: 'unacquired' }),
                    remember: false,
                },
            },
        ],
        result: [SUITE_DEVICE],
    },
    {
        description: `Remember stateless device`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [SUITE_DEVICE],
        },
        actions: [
            {
                type: deviceActions.setRememberDevice.type,
                payload: {
                    device: SUITE_DEVICE,
                    remember: true,
                },
            },
        ],
        result: [{ ...SUITE_DEVICE, remember: true }],
    },
    {
        description: `Remember device success`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                }),
            ],
        },
        actions: [
            {
                type: deviceActions.setRememberDevice.type,
                payload: {
                    device: mockSuiteDevice({
                        state: { staticSessionId: '1stTestnet@device_id:0' },
                    }),
                    remember: true,
                },
            },
        ],
        result: [
            mockSuiteDevice({
                state: { staticSessionId: '1stTestnet@device_id:0' },
                remember: true,
            }),
        ],
    },
    {
        description: `Remember device with multiple instances (few are stateless)`,
        initialState: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                }),
                mockSuiteDevice({
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                    instance: 1,
                }),
                mockSuiteDevice({
                    instance: 2,
                }),
                mockSuiteDevice({
                    state: { staticSessionId: '1stTestnet@device_id:0' },
                    instance: 3,
                }),
                mockSuiteDevice(
                    {
                        state: { staticSessionId: '1stTestnet@device_id:0' },
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
                type: deviceActions.setRememberDevice.type,
                payload: {
                    device: mockSuiteDevice({
                        state: { staticSessionId: '1stTestnet@device_id:0' },
                    }),
                    remember: true,
                },
            },
            {
                type: deviceActions.setRememberDevice.type,
                payload: {
                    device: mockSuiteDevice({
                        state: { staticSessionId: '1stTestnet@device_id:0' },
                        instance: 3,
                    }),
                    remember: true,
                },
            },
        ],
        result: [
            mockSuiteDevice({
                state: { staticSessionId: '1stTestnet@device_id:0' },
                remember: true,
            }),
            mockSuiteDevice({
                state: { staticSessionId: '1stTestnet@device_id:0' },
                instance: 1,
                remember: false,
            }),
            mockSuiteDevice({
                instance: 2,
            }),
            mockSuiteDevice({
                state: { staticSessionId: '1stTestnet@device_id:0' },
                instance: 3,
                remember: true,
            }),
            mockSuiteDevice(
                {
                    state: { staticSessionId: '1stTestnet@device_id:0' },
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
    selectDevice,
    forget,
    remember,
};
