import { deviceActions } from '@suite-common/device';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectNewlyConnectedDeviceThunk } from '@suite-common/wallet-core';
import { DEVICE, Device, TRANSPORT } from '@trezor/connect';

import { SUITE } from 'src/actions/suite/constants';
import { AppState, TorStatus } from 'src/types/suite';

import { SuiteState } from '../../../reducers/suite/suiteReducer';
import * as suiteActions from '../suiteActions';

const SUITE_DEVICE = mockSuiteDevice({ path: '1' });
const SUITE_DEVICE_UNACQUIRED = mockSuiteDevice({
    type: 'unacquired',
    path: '2',
});
const SUITE_DEVICE_REMEMBERED = mockSuiteDevice({ connected: false });
const CONNECT_DEVICE = mockConnectDevice({ path: '1' });

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
                payload: {},
            },
        ],
        result: [
            {
                transport: {},
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

const initialRun: Array<{ description: string; state?: Partial<SuiteState> }> = [
    {
        description: `initialRunCompleted (initialRun = true)`,
    },
    {
        description: `initialRunCompleted (initialRun = false)`,
        state: {
            flags: {
                initialRun: false,
                discreetModeCompleted: false,
                taprootBannerClosed: false,
                firmwareTypeBannerClosed: false,
                dashboardGraphHidden: false,
                securityStepsHidden: false,
                dashboardAssetsGridMode: true,
                showTEXDashboardPromoBanner: true,
                showTS7DashboardPromoBanner: true,
                showSettingsDesktopAppPromoBanner: true,
                stakeEthBannerClosed: false,
                stakeSolBannerClosed: false,
                stakeCardanoBannerClosed: false,
                suspiciousTransactionsTooltipClosed: false,
                showDashboardStakingPromoBanner: true,
                showCopyAddressModal: true,
                showUnhideTokenModal: true,
                enableAutoupdateOnNextRun: false,
                showBluetoothDebugInfo: false,
                stellarLimitedHistoryBannerClosed: false,
                solanaLimitedHistoryBannerClosed: false,
                hasSeenDisconnectTooltip: false,
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

const selectNewlyConnectedDevice = [
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
            device: { devices: [SUITE_DEVICE], selectedDevice: SUITE_DEVICE },
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
        device: mockConnectDevice({
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
        description: `disconnected selected device (3 instances: 2 remembered, 1 stateless which will be removed, no action)`,
        state: {
            suite: {},
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
        description: `switch to first unacquired device`,
        state: {
            suite: {},
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
        description: `switch to first connected device`,
        state: {
            suite: {},
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
        description: `switch to recently used device`,
        state: {
            suite: {},
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
                    mockSuiteDevice({
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
    initialRun,
    selectDevice,
    markDeviceAsRecentlyConnected,
    handleDeviceDisconnect,
    forgetDisconnectedDevices,
    observeSelectedDevice,
    acquireDevice,
    selectNewlyConnectedDevice,
};
