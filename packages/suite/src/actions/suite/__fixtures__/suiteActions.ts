import { onSuiteInit, onSuiteReady, updateOnlineStatus } from '@suite/suite-lifecycle';
import { deviceActions } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectNewlyConnectedDeviceThunk } from '@suite-common/wallet-core';
import { DEVICE, type Device, TRANSPORT } from '@trezor/connect';

import { type AppState } from 'src/types/suite';

import { setSuiteError } from '../suiteActions';

const SUITE_DEVICE = mockSuiteDevice({ path: '1' });
const SUITE_DEVICE_UNACQUIRED = mockSuiteDevice({
    type: 'unacquired',
    path: '2',
});
const SUITE_DEVICE_CONNECTED = mockSuiteDevice({ path: '1', connected: true });
const SUITE_DEVICE_REMEMBERED = mockSuiteDevice({ connected: false });
const CONNECT_DEVICE = mockConnectDevice({ path: '1' });

const reducerActions = [
    {
        description: `SUITE.READY`,
        actions: [onSuiteReady()],
        result: [
            {
                lifecycle: {
                    status: 'ready',
                },
            },
        ],
    },
    {
        description: `SUITE.ERROR`,
        actions: [setSuiteError('Error')],
        result: [
            {
                lifecycle: {
                    status: 'error',
                    error: 'Error',
                },
            },
        ],
    },
    {
        description: `SUITE.INIT`,
        actions: [onSuiteInit()],
        result: [
            {
                lifecycle: {
                    status: 'loading',
                },
            },
        ],
    },
    {
        description: `updateOnlineStatus (true/false)`,
        actions: [updateOnlineStatus(true), updateOnlineStatus(false)],
        result: [
            {
                online: true,
            },
            {
                online: false,
            },
        ],
    },
    {
        description: `TRANSPORT.START`,
        actions: [
            {
                type: TRANSPORT.START,
                payload: {
                    type: 'BridgeTransport',
                },
            },
        ],
        result: [{ transport: { transports: [{ type: 'BridgeTransport' }] } }],
    },
    {
        description: `TRANSPORT.ERROR`,
        actions: [
            {
                type: TRANSPORT.ERROR,
                payload: {},
            },
        ],
        result: [
            {
                transport: {},
            },
        ],
    },
];

const selectDevice = [
    {
        description: `device undefined`,
        state: {},
        device: undefined,
        result: {
            payload: undefined,
        },
    },
    {
        description: `device not found in reducer`,
        state: {
            device: {
                devices: [SUITE_DEVICE_UNACQUIRED],
            },
        },
        device: SUITE_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: `one unacquired device`,
        state: {
            device: {
                devices: [SUITE_DEVICE_UNACQUIRED],
            },
        },
        device: SUITE_DEVICE_UNACQUIRED,
        result: {
            payload: SUITE_DEVICE_UNACQUIRED,
        },
    },
    {
        description: `two unacquired devices`,
        state: {
            device: {
                devices: [
                    mockSuiteDevice({
                        type: 'unacquired',
                        path: '2',
                    }),
                    SUITE_DEVICE_UNACQUIRED,
                ],
            },
        },
        device: SUITE_DEVICE_UNACQUIRED,
        result: {
            payload: SUITE_DEVICE_UNACQUIRED,
        },
    },
    {
        description: `two instances of device (@suite TrezorDevice)`,
        state: {
            device: {
                devices: [
                    mockSuiteDevice({
                        path: '1',
                    }),
                    mockSuiteDevice({
                        path: '1',
                        instance: 1,
                    }),
                ],
            },
        },
        device: mockSuiteDevice({
            path: '1',
            instance: 1,
        }),
        result: {
            payload: mockSuiteDevice({
                path: '1',
                instance: 1,
            }),
        },
    },
    {
        description: `two instances of device (@trezor/connect Device)`,
        state: {
            device: {
                devices: [
                    mockSuiteDevice({
                        path: '1',
                        ts: 1,
                    }),
                    mockSuiteDevice({
                        path: '1',
                        instance: 1,
                        ts: 2,
                    }),
                ],
            },
        },
        device: mockConnectDevice({
            path: '1',
        }),
        result: {
            payload: mockSuiteDevice({
                path: '1',
                instance: 1,
                ts: 2,
            }),
        },
    },
];

type SelectNewlyConnectedDeviceFixture = {
    description: string;
    state: {
        device: Partial<AppState['device']>;
        firmware?: Partial<AppState['firmware']>;
        suite?: Partial<AppState['suite']>;
    };
    newlyConnectedDevice: Device | TrezorDevice;
    expectedNextActionType: string;
};

const selectNewlyConnectedDevice: SelectNewlyConnectedDeviceFixture[] = [
    {
        description: `select a new device`,
        state: {
            device: { devices: [] },
        },
        newlyConnectedDevice: CONNECT_DEVICE,
        expectedNextActionType: selectNewlyConnectedDeviceThunk.fulfilled.type,
    },
    {
        description:
            'selects a newly connected physical device corresponding to selected remembered wallet',
        state: {
            device: { devices: [SUITE_DEVICE_REMEMBERED], selectedDevice: SUITE_DEVICE_REMEMBERED },
            suite: {},
        },
        newlyConnectedDevice: CONNECT_DEVICE,
        expectedNextActionType: selectNewlyConnectedDeviceThunk.fulfilled.type,
    },
    {
        description: `doesn't select a newly connected device if it is already selected`,
        state: {
            device: {
                devices: [SUITE_DEVICE_CONNECTED],
                selectedDevice: SUITE_DEVICE_CONNECTED,
            },
            suite: {},
        },
        newlyConnectedDevice: SUITE_DEVICE_UNACQUIRED,
        expectedNextActionType: selectNewlyConnectedDeviceThunk.rejected.type,
    },
    {
        description: `selects a newly connected device when the selected wallet has no device connected`,
        state: {
            device: { devices: [SUITE_DEVICE_REMEMBERED], selectedDevice: SUITE_DEVICE_REMEMBERED },
            suite: {},
        },
        newlyConnectedDevice: SUITE_DEVICE_UNACQUIRED,
        expectedNextActionType: selectNewlyConnectedDeviceThunk.fulfilled.type,
    },
    {
        description: `doesn't select a newly connected device during a firmware installation`,
        state: {
            device: { devices: [SUITE_DEVICE_REMEMBERED], selectedDevice: SUITE_DEVICE_REMEMBERED },
            firmware: { status: 'started' },
            suite: {},
        },
        newlyConnectedDevice: SUITE_DEVICE_UNACQUIRED,
        expectedNextActionType: selectNewlyConnectedDeviceThunk.rejected.type,
    },
];

type MarkDeviceAsRecentlyConnectedFixture = {
    description: string;
    state: {
        suite: Partial<AppState['suite']>;
        device: Partial<AppState['device']>;
    };
    newlyConnectedDevice: Device;
    isSetAsRecentlyConnected: boolean;
};

const markDeviceAsRecentlyConnected: MarkDeviceAsRecentlyConnectedFixture[] = [
    {
        description: `does not mark device as recently connected if there are none`,
        state: { device: {}, suite: {} },
        newlyConnectedDevice: CONNECT_DEVICE,
        isSetAsRecentlyConnected: false,
    },
    {
        description: `does not mark a newly connected physical device corresponding to selected remembered wallet `,
        state: {
            device: { devices: [SUITE_DEVICE_REMEMBERED], selectedDevice: SUITE_DEVICE_REMEMBERED },
            suite: {},
        },
        newlyConnectedDevice: CONNECT_DEVICE,
        isSetAsRecentlyConnected: false,
    },
    {
        description: `marks device as recently connected if not seen before`,
        state: {
            device: { devices: [SUITE_DEVICE_REMEMBERED], selectedDevice: SUITE_DEVICE_REMEMBERED },
            suite: {},
        },
        newlyConnectedDevice: { ...CONNECT_DEVICE, id: 'a-different-id' } as Device,
        isSetAsRecentlyConnected: true,
    },
];

const forgetDisconnectedDevices = [
    {
        description: `no affected devices (unacquired)`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE_UNACQUIRED,
                devices: [SUITE_DEVICE_UNACQUIRED],
            },
        },
        device: mockConnectDevice({
            path: '2',
        }),
        result: [],
    },
    {
        description: `no remembered devices, all affected`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    mockSuiteDevice({
                        path: '1',
                        instance: 1,
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: [
            { path: '1', instance: undefined },
            { path: '1', instance: 1 },
        ],
    },
    {
        description: `mix of affected and unaffected devices`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    mockSuiteDevice({
                        path: '1',
                        instance: 1,
                    }),
                    mockSuiteDevice({
                        path: '1',
                        instance: 2,
                        remember: true,
                        state: { staticSessionId: '1stTestnetAddress@device_1_id:0' },
                    }),
                    mockSuiteDevice({
                        path: '2',
                        id: 'device-id-2',
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: [
            { path: '1', instance: undefined },
            { path: '1', instance: 1 },
        ],
    },
    {
        description: `bootloader mode device`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    mockSuiteDevice({
                        path: '1',
                        instance: undefined,
                        remember: true,
                        mode: 'bootloader',
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: [{ path: '1', instance: undefined }],
    },
];

const observeSelectedDevice = [
    {
        description: `ignored action`,
        state: {},
        action: {
            type: 'foo',
        },
        observeResult: {
            isDeviceChanged: false,
            isDeviceBecomingAcquired: false,
            isDeviceBecomingConnected: false,
        },
    },
    {
        description: `no selected device in reducer`,
        state: {},
        action: {
            type: DEVICE.CONNECT,
        },
        observeResult: {
            isDeviceChanged: false,
            isDeviceBecomingAcquired: false,
            isDeviceBecomingConnected: false,
        },
    },
    {
        description: `device not changed`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [SUITE_DEVICE],
            },
        },
        observeResult: {
            isDeviceChanged: false,
            isDeviceBecomingAcquired: false,
            isDeviceBecomingConnected: false,
        },
    },
    {
        description: `device is changed when it becomes connected`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    mockSuiteDevice({
                        connected: true,
                    }),
                ],
            },
        },
        actions: [deviceActions.updateSelectedDevice.type],
        observeResult: {
            isDeviceChanged: true,
            isDeviceBecomingAcquired: false,
            isDeviceBecomingConnected: true,
        },
    },
    {
        description: `device is changed (missing in reducer)`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [],
            },
        },
        observeResult: {
            isDeviceChanged: true,
            isDeviceBecomingAcquired: false,
            isDeviceBecomingConnected: false,
        },
    },
    {
        description: `device is changed and becomes acquired`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE_UNACQUIRED,
                devices: [
                    mockSuiteDevice({
                        path: SUITE_DEVICE_UNACQUIRED.path,
                        connected: true,
                    }),
                ],
            },
        },
        actions: [deviceActions.updateSelectedDevice.type],
        observeResult: {
            isDeviceChanged: true,
            isDeviceBecomingAcquired: true,
            isDeviceBecomingConnected: true,
        },
    },
    {
        description: `device is already connected and becomes acquired`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: {
                    ...SUITE_DEVICE_UNACQUIRED,
                    connected: true,
                },
                devices: [
                    mockSuiteDevice({
                        path: SUITE_DEVICE_UNACQUIRED.path,
                        connected: true,
                    }),
                ],
            },
        },
        actions: [deviceActions.updateSelectedDevice.type],
        observeResult: {
            isDeviceChanged: true,
            isDeviceBecomingAcquired: true,
            isDeviceBecomingConnected: false,
        },
    },
];

const acquireDevice = [
    {
        description: `success`,
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
            },
        },
        result: '@suite/device/removeButtonRequests',
    },
    {
        description: `success with requestedDevice param`,
        state: {
            device: {},
        },
        requestedDevice: SUITE_DEVICE,
        result: '@suite/device/removeButtonRequests',
    },
    {
        description: `with TrezorConnect error`,
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
            },
        },
        getFeatures: {
            success: false,
            error: {
                message: 'getFeatures error',
            },
        },
        result: notificationsActions.addToast.type,
    },
    {
        description: `without device`,
        state: { selectedDevice: {} },
    },
];

export default {
    reducerActions,
    selectDevice,
    markDeviceAsRecentlyConnected,
    forgetDisconnectedDevices,
    observeSelectedDevice,
    acquireDevice,
    selectNewlyConnectedDevice,
};
