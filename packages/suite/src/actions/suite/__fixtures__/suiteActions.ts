import { testMocks } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { deviceActions } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import { TorStatus } from 'src/types/suite';

import * as suiteActions from '../suiteActions';

const { getSuiteDevice, getConnectDevice } = testMocks;

const SUITE_DEVICE = getSuiteDevice({ path: '1' });
const SUITE_DEVICE_UNACQUIRED = getSuiteDevice({
    type: 'unacquired',
    path: '2',
});
const CONNECT_DEVICE = getConnectDevice({ path: '1' });

const reducerActions = [
    {
        description: `SUITE.READY`,
        actions: [
            {
                type: SUITE.READY,
            },
        ],
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
        actions: [
            {
                type: SUITE.ERROR,
                error: 'Error',
            },
        ],
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
        actions: [
            {
                type: SUITE.INIT,
            },
        ],
        result: [
            {
                lifecycle: {
                    status: 'loading',
                },
            },
        ],
    },
    {
        description: `lockUI (true/false)`,
        actions: [suiteActions.lockUI(true), suiteActions.lockUI(false)],
        result: [{ locks: { ui: 1 } }, { locks: { ui: 0 } }],
    },
    {
        description: `lockDevice (true/false)`,
        actions: [suiteActions.lockDevice(true), suiteActions.lockDevice(false)],
        result: [{ locks: { device: 1 } }, { locks: { device: 0 } }],
    },
    {
        description: `lockRouter (true/false)`,
        actions: [suiteActions.lockRouter(true), suiteActions.lockRouter(false)],
        result: [{ locks: { router: 1 } }, { locks: { router: 0 } }],
    },
    {
        description: `updateOnlineStatus (true/false)`,
        actions: [suiteActions.updateOnlineStatus(true), suiteActions.updateOnlineStatus(false)],
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
        description: `updateTorStatus (true/false)`,
        actions: [
            suiteActions.updateTorStatus(TorStatus.Enabled),
            suiteActions.updateTorStatus(TorStatus.Disabled),
        ],
        result: [
            {
                torStatus: TorStatus.Enabled,
            },
            {
                torStatus: TorStatus.Disabled,
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
                payload: {
                    bridge: {
                        version: [1],
                    },
                },
            },
        ],
        result: [
            {
                transport: {
                    bridge: {
                        version: [1],
                    },
                },
            },
        ],
    },
    {
        description: `SUITE.SET_LANGUAGE`,
        actions: [
            {
                type: SUITE.SET_LANGUAGE,
                locale: 'cz',
            },
        ],
        result: [
            {
                settings: {
                    language: 'cz',
                },
            },
        ],
    },
];

const initialRun = [
    {
        description: `initialRunCompleted (initialRun = true)`,
    },
    {
        description: `initialRunCompleted (initialRun = false)`,
        state: {
            flags: {
                initialRun: false,
                initialWebRun: false,
                discreetModeCompleted: false,
                taprootBannerClosed: false,
                firmwareTypeBannerClosed: false,
                dashboardGraphHidden: false,
                securityStepsHidden: false,
                dashboardAssetsGridMode: true,
                showDashboardT3T1PromoBanner: false,
                showSettingsDesktopAppPromoBanner: true,
                stakeEthBannerClosed: false,
                stakeSolBannerClosed: false,
                suspiciousTransactionsTooltipClosed: false,
                showDashboardStakingPromoBanner: true,
                viewOnlyPromoClosed: true,
                viewOnlyTooltipClosed: true,
                isDashboardPassphraseBannerVisible: true,
                showCopyAddressModal: true,
                showUnhideTokenModal: true,
                enableAutoupdateOnNextRun: false,
                isBluetoothEnabled: false,
                showBluetoothDebugInfo: false,
                stellarLimitedHistoryBannerClosed: false,
            },
        },
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
                    getSuiteDevice({
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
                    getSuiteDevice({
                        path: '1',
                    }),
                    getSuiteDevice({
                        path: '1',
                        instance: 1,
                    }),
                ],
            },
        },
        device: getSuiteDevice({
            path: '1',
            instance: 1,
        }),
        result: {
            payload: getSuiteDevice({
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
                    getSuiteDevice({
                        path: '1',
                        ts: 1,
                    }),
                    getSuiteDevice({
                        path: '1',
                        instance: 1,
                        ts: 2,
                    }),
                ],
            },
        },
        device: getConnectDevice({
            path: '1',
        }),
        result: {
            payload: getSuiteDevice({
                path: '1',
                instance: 1,
                ts: 2,
            }),
        },
    },
];

const handleDeviceConnect = [
    {
        description: `select connected device`,
        state: {
            device: { devices: [SUITE_DEVICE] },
            suite: {},
        },
        device: CONNECT_DEVICE,
        result: deviceActions.selectDevice.type,
    },
    {
        description: `ignore`,
        state: {
            device: { selectedDevice: SUITE_DEVICE },
            suite: {},
        },
        device: CONNECT_DEVICE,
    },
];

const handleDeviceDisconnect = [
    {
        description: `no selected device in reducer`,
        state: {},
        device: CONNECT_DEVICE,
    },
    {
        description: `disconnect not selected device`,
        state: {
            suite: {},
            device: { selectedDevice: SUITE_DEVICE },
        },
        device: getConnectDevice({
            path: '2',
        }),
    },
    {
        description: `disconnected selected device`,
        state: {
            suite: {},
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
        description: `disconnected selected remembered device (no action)`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    getSuiteDevice({
                        path: '1',
                        state: '1stTestnetAddress@device_b_id:0',
                        remember: true,
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
    },
    {
        description: `disconnected selected device (3 instances: 2 remembered, 1 stateless which will be removed, no action)`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    getSuiteDevice({
                        path: '1',
                        state: '1stTestnetAddress@device_a_id:0',
                        instance: 2,
                        remember: true,
                    }),
                    getSuiteDevice({
                        path: '1',
                        state: '1stTestnetAddress@device_b_id:0',
                        instance: 1,
                        remember: true,
                    }),
                ],
            },
        },
        device: CONNECT_DEVICE,
        result: {
            type: deviceActions.selectDevice.type,
            payload: getSuiteDevice({
                state: '1stTestnetAddress@device_b_id:0',
                instance: 1,
                remember: true,
            }),
        },
    },
    {
        description: `switch to first unacquired device`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    SUITE_DEVICE,
                    getSuiteDevice({
                        type: 'unacquired',
                        path: '3',
                    }),
                    getSuiteDevice({
                        type: 'unacquired',
                        path: '2',
                    }),
                    getSuiteDevice(
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
            payload: getSuiteDevice({
                type: 'unacquired',
                path: '3',
            }),
        },
    },
    {
        description: `switch to first connected device`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    getSuiteDevice(
                        {
                            path: '2',
                        },
                        {
                            device_id: '2',
                        },
                    ),
                    getSuiteDevice(
                        {
                            path: '3',
                            connected: true,
                            ts: 1,
                        },
                        {
                            device_id: '3',
                        },
                    ),
                    getSuiteDevice(
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
            payload: getSuiteDevice(
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
        description: `switch to recently used device`,
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    getSuiteDevice(
                        {
                            path: '2',
                            ts: 2,
                        },
                        {
                            device_id: '2',
                        },
                    ),
                    getSuiteDevice(
                        {
                            path: '3',
                            ts: 3,
                        },
                        {
                            device_id: '3',
                        },
                    ),
                    getSuiteDevice(
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
            payload: getSuiteDevice(
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
        device: getConnectDevice({
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
                    getSuiteDevice({
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
                    getSuiteDevice({
                        path: '1',
                        instance: 1,
                    }),
                    getSuiteDevice({
                        path: '1',
                        instance: 2,
                        remember: true,
                    }),
                    getSuiteDevice({
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
];

const observeSelectedDevice = [
    {
        description: `ignored action`,
        state: {},
        action: {
            type: 'foo',
        },
        changed: false,
    },
    {
        description: `no selected device in reducer`,
        state: {},
        action: {
            type: DEVICE.CONNECT,
        },
        changed: false,
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
        changed: false,
    },
    {
        description: `device is changed`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {},
            device: {
                selectedDevice: SUITE_DEVICE,
                devices: [
                    getSuiteDevice({
                        connected: true,
                    }),
                ],
            },
        },
        result: deviceActions.updateSelectedDevice.type,
        changed: true,
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
        changed: true,
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
        result: SUITE.LOCK_DEVICE,
    },
    {
        description: `success with requestedDevice param`,
        state: {
            device: {},
        },
        requestedDevice: SUITE_DEVICE,
        result: SUITE.LOCK_DEVICE,
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
            payload: {
                error: 'getFeatures error',
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
    initialRun,
    selectDevice,
    handleDeviceConnect,
    handleDeviceDisconnect,
    forgetDisconnectedDevices,
    observeSelectedDevice,
    acquireDevice,
};
