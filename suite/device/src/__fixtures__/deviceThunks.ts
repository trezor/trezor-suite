import { deviceActions } from '@suite-common/device';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { Device } from '@trezor/connect';

const SUITE_DEVICE = mockSuiteDevice({ path: '1' });
const CONNECT_DEVICE = mockConnectDevice({ path: '1' });

type Fixture = {
    description: string;
    state: {
        device?: Record<string, unknown>;
        router?: Record<string, unknown>;
    };
    device: Device;
    result?: {
        type?: string;
        payload: unknown;
    };
};

const disconnectDeviceThunkFixture: Fixture[] = [
    {
        description: 'no selected device in reducer',
        state: {},
        device: CONNECT_DEVICE,
    },
    {
        description: 'disconnect not selected device',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
            },
        },
        device: mockConnectDevice({ path: '2' }),
    },
    {
        description: 'disconnected selected device during onboarding',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [SUITE_DEVICE],
            },
            router: {
                app: 'onboarding',
            },
        },
        device: CONNECT_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: 'disconnected selected device on standard route',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [SUITE_DEVICE],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: 'disconnected selected remembered device (no action)',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    mockSuiteDevice({
                        path: '1',
                        state: { staticSessionId: '1stTestnetAddress@device_b_id:0' },
                        remember: true,
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
    },
    {
        description:
            'disconnected selected device (3 instances: 2 remembered, 1 stateless which will be removed, no action)',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    mockSuiteDevice({
                        path: '1',
                        state: { staticSessionId: '1stTestnetAddress@device_a_id:0' },
                        instance: 2,
                        remember: true,
                    }),
                    mockSuiteDevice({
                        path: '1',
                        state: { staticSessionId: '1stTestnetAddress@device_b_id:0' },
                        instance: 1,
                        remember: true,
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            type: deviceActions.selectDevice.type,
            payload: mockSuiteDevice({
                state: { staticSessionId: '1stTestnetAddress@device_b_id:0' },
                instance: 1,
                remember: true,
            }),
        },
    },
    {
        description: 'switch to first unacquired device',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    mockSuiteDevice({
                        type: 'unacquired',
                        path: '3',
                    }),
                    mockSuiteDevice({
                        type: 'unacquired',
                        path: '2',
                    }),
                    mockSuiteDevice(
                        {
                            path: '4',
                        },
                        {
                            device_id: '4',
                        },
                    ),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            payload: mockSuiteDevice({
                type: 'unacquired',
                path: '3',
            }),
        },
    },
    {
        description: 'switch to first connected device',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    mockSuiteDevice(
                        {
                            path: '2',
                        },
                        {
                            device_id: '2',
                        },
                    ),
                    mockSuiteDevice(
                        {
                            path: '3',
                            connected: true,
                            ts: 1,
                        },
                        {
                            device_id: '3',
                        },
                    ),
                    mockSuiteDevice(
                        {
                            path: '4',
                            connected: true,
                            ts: 2,
                        },
                        {
                            device_id: '4',
                        },
                    ),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            payload: mockSuiteDevice(
                {
                    connected: true,
                    path: '4',
                    ts: 2,
                },
                {
                    device_id: '4',
                },
            ),
        },
    },
    {
        description: 'switch to recently used device',
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    mockSuiteDevice(
                        {
                            path: '2',
                            ts: 2,
                        },
                        {
                            device_id: '2',
                        },
                    ),
                    mockSuiteDevice(
                        {
                            path: '3',
                            ts: 3,
                        },
                        {
                            device_id: '3',
                        },
                    ),
                    mockSuiteDevice(
                        {
                            path: '4',
                            ts: 1,
                        },
                        {
                            device_id: '4',
                        },
                    ),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            payload: mockSuiteDevice(
                {
                    path: '3',
                    ts: 3,
                },
                {
                    device_id: '3',
                },
            ),
        },
    },
];

export default disconnectDeviceThunkFixture;
