import { testMocks } from '@suite-common/test-utils';
import { discoveryActions, deviceActions } from '@suite-common/wallet-core';
import { DEVICE, TRANSPORT } from '@trezor/connect';
import { notificationsActions } from '@suite-common/toast-notifications';

import { SUITE, MODAL } from 'src/actions/suite/constants';
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
        result: [
            {
                locks: [SUITE.LOCK_TYPE.UI],
            },
            {
                locks: [],
            },
        ],
    },
    {
        description: `lockDevice (true/false)`,
        actions: [suiteActions.lockDevice(true), suiteActions.lockDevice(false)],
        result: [
            {
                locks: [SUITE.LOCK_TYPE.DEVICE],
            },
            {
                locks: [],
            },
        ],
    },
    {
        description: `lockRouter (true/false)`,
        actions: [suiteActions.lockRouter(true), suiteActions.lockRouter(false)],
        result: [
            {
                locks: [SUITE.LOCK_TYPE.ROUTER],
            },
            {
                locks: [],
            },
        ],
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
        result: [
            {
                transport: {
                    type: 'BridgeTransport',
                },
            },
        ],
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
    {
        description: `startDiscovery/stopDiscovery + startDiscovery/completeDiscovery`,
        actions: [
            {
                type: discoveryActions.startDiscovery.type,
            },
            {
                type: discoveryActions.stopDiscovery.type,
            },
            {
                type: discoveryActions.startDiscovery.type,
            },
            {
                type: discoveryActions.completeDiscovery.type,
            },
        ],
        result: [
            {
                locks: [SUITE.LOCK_TYPE.DEVICE],
            },
            {
                locks: [],
            },
            {
                locks: [SUITE.LOCK_TYPE.DEVICE],
            },
            {
                locks: [],
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
                showDashboardT2B1PromoBanner: false,
                showSettingsDesktopAppPromoBanner: true,
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
    {
        description: `waiting-for-bootloader`,
        state: {
            device: {
                selectedDevice: SUITE_DEVICE,
            },
            suite: {},
            firmware: { status: 'waiting-for-bootloader' },
        },
        device: getConnectDevice({ path: '3', mode: 'bootloader' }),
        result: deviceActions.selectDevice.type,
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
                        state: 'abc',
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
                        state: 'cba',
                        instance: 2,
                        remember: true,
                    }),
                    getSuiteDevice({
                        path: '1',
                        state: 'abc',
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
                state: 'abc',
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

const authorizeDevice = [
    {
        description: `without device`,
        state: {},
        result: undefined,
    },
    {
        description: `with disconnected device`,
        state: {
            selectedDevice: getSuiteDevice(),
        },
        result: undefined,
    },
    {
        description: `with unacquired device`,
        state: {
            selectedDevice: getSuiteDevice({
                type: 'unacquired',
                connected: true,
            }),
        },
        result: undefined,
    },
    {
        description: `with device which already has state`,
        state: {
            selectedDevice: getSuiteDevice({
                connected: true,
                state: '012345',
            }),
        },
        result: undefined,
    },
    {
        description: `with device in unexpected mode`,
        state: {
            selectedDevice: getSuiteDevice({
                connected: true,
                mode: 'bootloader',
            }),
        },
        result: undefined,
    },
    {
        description: `with device which needs FW update`,
        suiteState: {
            selectedDevice: getSuiteDevice({
                connected: true,
                firmware: 'required',
            }),
        },
        result: undefined,
    },
    {
        description: `success`,
        suiteState: {
            selectedDevice: getSuiteDevice({
                connected: true,
            }),
        },
        result: deviceActions.authDevice.type,
    },
    {
        description: `duplicate detected`,
        suiteState: {
            selectedDevice: getSuiteDevice({
                connected: true,
                instance: 2,
                state: undefined,
            }),
        },
        devicesState: [
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 1,
                state: 'state@device-id:1',
            }),
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 2,
                state: undefined,
            }),
        ],
        result: MODAL.OPEN_USER_CONTEXT,
        deviceReducerResult: [
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 1,
                state: 'state@device-id:1',
            }),
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 2,
                state: undefined,
            }),
        ],
    },
    {
        // detected duplicate was authorized "on device" therefore it's know as "hidden wallet"
        // selected device is authorized "on host" as "standard wallet"
        description: `duplicate detected (current device has useEmptyPassphrase flag)`,
        suiteState: {
            selectedDevice: getSuiteDevice({
                connected: true,
                useEmptyPassphrase: true,
                instance: 2,
                state: undefined,
            }),
        },
        devicesState: [
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 1,
                state: 'state@device-id:1',
            }),
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: true,
                instance: 2,
                state: undefined,
            }),
        ],
        result: MODAL.OPEN_USER_CONTEXT,
        deviceReducerResult: [
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: true,
                instance: 1,
                state: 'state@device-id:1',
            }),
            getSuiteDevice({
                connected: true,
                useEmptyPassphrase: false,
                instance: 2,
                state: undefined,
            }),
        ],
    },
    {
        description: `with TrezorConnect error`,
        suiteState: {
            selectedDevice: getSuiteDevice({
                connected: true,
            }),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'getDeviceState error',
            },
        },
        result: notificationsActions.addToast.type,
    },
];

const authConfirm = [
    {
        description: `without device`,
        state: {},
        result: undefined,
    },
    {
        description: `failed getDeviceState`,
        state: {
            selectedDevice: getSuiteDevice(),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'getDeviceState error',
            },
        },
        result: {
            type: deviceActions.receiveAuthConfirm.type,
            payload: {
                success: false,
            },
        },
    },
    {
        description: `cancelled getDeviceState`,
        state: {
            selectedDevice: getSuiteDevice(),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'auth-confirm-cancel',
            },
        },
        result: {
            type: deviceActions.forgetDevice.type,
        },
    },
    {
        description: `mismatch`,
        state: {
            selectedDevice: getSuiteDevice({ state: 'ABCD' }),
        },
        result: {
            type: deviceActions.receiveAuthConfirm.type,
            payload: {
                success: false,
            },
        },
    },
    {
        description: `success`,
        state: {
            selectedDevice: getSuiteDevice({ instance: 1, state: 'state@device-id:1' }),
        },
        result: {
            type: deviceActions.receiveAuthConfirm.type,
            payload: {
                success: true,
            },
        },
    },
];

const createDeviceInstance = [
    {
        description: `with unacquired device`,
        state: {
            device: {
                selectedDevice: getSuiteDevice({
                    type: 'unacquired',
                    connected: true,
                }),
            },
        },
        result: undefined,
    },
    {
        description: `without passphrase_protection`,
        state: {
            device: {
                selectedDevice: getSuiteDevice({
                    connected: true,
                }),
            },
        },
        result: deviceActions.createDeviceInstance.type,
    },
    {
        description: `without passphrase_protection and @trezor/connect error`,
        state: {
            device: {
                selectedDevice: getSuiteDevice({
                    connected: true,
                }),
            },
        },
        applySettings: {
            success: false,
            payload: {
                error: 'applySettings error',
            },
        },
        result: notificationsActions.addToast.type,
    },
    {
        description: `with passphrase_protection enabled`,
        state: {
            device: {
                selectedDevice: getSuiteDevice(
                    {
                        connected: true,
                    },
                    {
                        passphrase_protection: true,
                    },
                ),
            },
        },
        applySettings: {
            success: false,
            payload: {
                error: 'applySettings error',
            },
        },
        result: deviceActions.createDeviceInstance.type,
    },
];

const switchDuplicatedDevice = [
    {
        description: `success`,
        state: {
            device: {
                devices: [SUITE_DEVICE],
                selectedDevice: getSuiteDevice({
                    instance: 1,
                }),
            },
        },
        device: getSuiteDevice({
            instance: 1,
        }),
        duplicate: SUITE_DEVICE,
        result: {
            selected: SUITE_DEVICE,
            devices: [SUITE_DEVICE],
        },
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
    authorizeDevice,
    authConfirm,
    createDeviceInstance,
    switchDuplicatedDevice,
};
