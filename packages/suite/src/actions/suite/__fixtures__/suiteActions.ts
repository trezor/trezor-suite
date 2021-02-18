/* eslint-disable @typescript-eslint/naming-convention */
import { DEVICE, TRANSPORT } from 'trezor-connect';
import { SUITE, STORAGE, NOTIFICATION, MODAL } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as suiteActions from '../suiteActions';

const { getSuiteDevice, getConnectDevice } = global.JestMocks;

const SUITE_DEVICE = getSuiteDevice({ path: '1' });
const SUITE_DEVICE_UNACQUIRED = getSuiteDevice({
    type: 'unacquired',
    path: '2',
});
const CONNECT_DEVICE = getConnectDevice({ path: '1' });

const reducerActions = [
    {
        description: `onSuiteReady`,
        actions: [suiteActions.onSuiteReady()],
        result: [
            {
                loading: false,
                loaded: true,
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
                loading: false,
                loaded: false,
                error: 'Error',
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
                loading: true,
                loaded: false,
            },
        ],
    },
    {
        description: `STORAGE.LOADED`,
        actions: [
            {
                type: STORAGE.LOADED,
                payload: {
                    suite: {
                        flags: {
                            initialRun: false,
                        },
                        settings: {
                            language: 'cs',
                        },
                    },
                },
            },
        ],
        result: [
            {
                flags: {
                    initialRun: false,
                },
                settings: {
                    language: 'cs',
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
        actions: [suiteActions.updateTorStatus(true), suiteActions.updateTorStatus(false)],
        result: [
            {
                tor: true,
            },
            {
                tor: false,
            },
        ],
    },
    {
        description: `TRANSPORT.START`,
        actions: [
            {
                type: TRANSPORT.START,
                payload: {
                    type: 'bridge',
                },
            },
        ],
        result: [
            {
                transport: {
                    type: 'bridge',
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
                messages: {
                    key: 'value',
                },
            },
        ],
        result: [
            {
                settings: {
                    language: 'cz',
                },
                messages: {
                    key: 'value',
                },
            },
        ],
    },
    {
        description: `DISCOVERY.START/DISCOVERY.STOP + DISCOVERY.START/DISCOVERY.COMPLETE`,
        actions: [
            {
                type: DISCOVERY.START,
            },
            {
                type: DISCOVERY.STOP,
            },
            {
                type: DISCOVERY.START,
            },
            {
                type: DISCOVERY.COMPLETE,
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
                bech32BannerClosed: false,
                dashboardGraphHidden: false,
                securityStepsHidden: false,
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
            devices: [SUITE_DEVICE_UNACQUIRED],
        },
        device: SUITE_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: `one unacquired device`,
        state: {
            devices: [SUITE_DEVICE_UNACQUIRED],
        },
        device: SUITE_DEVICE_UNACQUIRED,
        result: {
            payload: SUITE_DEVICE_UNACQUIRED,
        },
    },
    {
        description: `two unacquired devices`,
        state: {
            devices: [
                getSuiteDevice({
                    type: 'unacquired',
                    path: '2',
                }),
                SUITE_DEVICE_UNACQUIRED,
            ],
        },
        device: SUITE_DEVICE_UNACQUIRED,
        result: {
            payload: SUITE_DEVICE_UNACQUIRED,
        },
    },
    {
        description: `two instances of device (@suite TrezorDevice)`,
        state: {
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
        description: `two instances of device (trezor-connect Device)`,
        state: {
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
            devices: [SUITE_DEVICE],
        },
        device: CONNECT_DEVICE,
        result: SUITE.SELECT_DEVICE,
    },
    {
        description: `ignore`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
        },
        device: CONNECT_DEVICE,
    },
    {
        description: `waiting-for-bootloader`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            firmware: { status: 'waiting-for-bootloader' },
        },
        device: getConnectDevice({ path: '3', mode: 'bootloader' }),
        result: SUITE.SELECT_DEVICE,
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
            suite: {
                device: SUITE_DEVICE,
            },
        },
        device: getConnectDevice({
            path: '2',
        }),
    },
    {
        description: `disconnected selected device`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [SUITE_DEVICE],
        },
        device: CONNECT_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: `disconnected selected remembered device (no action)`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [
                getSuiteDevice({
                    path: '1',
                    state: 'abc',
                    remember: true,
                }),
            ],
        },
        device: CONNECT_DEVICE,
    },
    {
        description: `disconnected selected device (3 instances: 2 remembered, 1 stateless which will be removed, no action)`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
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
        device: CONNECT_DEVICE,
        result: {
            type: SUITE.SELECT_DEVICE,
            payload: getSuiteDevice({
                state: 'abc',
                instance: 1,
                remember: true,
            }),
        },
    },
    // {
    //     description: `disconnected selected device with router locked`,
    //     state: {
    //         suite: {
    //             device: SUITE_DEVICE,
    //             locks: [SUITE.LOCK_TYPE.ROUTER],
    //         },
    //         devices: [
    //             SUITE_DEVICE,
    //             getSuiteDevice(
    //                 {
    //                     path: '2',
    //                 },
    //                 {
    //                     device_id: '2',
    //                 },
    //             ),
    //         ],
    //     },
    //     device: CONNECT_DEVICE,
    //     result: {
    //         payload: undefined,
    //     },
    // },
    {
        description: `switch to first unacquired device`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
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
            suite: {
                device: SUITE_DEVICE,
            },
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
            suite: {
                device: SUITE_DEVICE,
            },
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
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [SUITE_DEVICE],
        },
        changed: false,
    },
    {
        description: `device is changed`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [
                getSuiteDevice({
                    connected: true,
                }),
            ],
        },
        result: SUITE.UPDATE_SELECTED_DEVICE,
        changed: true,
    },
    {
        description: `device is changed (missing in reducer)`,
        action: {
            type: DEVICE.CONNECT,
        },
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [],
        },
        changed: true,
    },
];

const acquireDevice = [
    {
        description: `success`,
        state: {
            device: SUITE_DEVICE,
        },
        result: SUITE.LOCK_DEVICE,
    },
    {
        description: `success with requestedDevice param`,
        state: {},
        requestedDevice: SUITE_DEVICE,
        result: SUITE.LOCK_DEVICE,
    },
    {
        description: `with TrezorConnect error`,
        state: {
            device: SUITE_DEVICE,
        },
        getFeatures: {
            success: false,
            payload: {
                error: 'getFeatures error',
            },
        },
        result: NOTIFICATION.TOAST,
    },
    {
        description: `without device`,
        state: {},
        result: SUITE.CONNECT_INITIALIZED,
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
            device: getSuiteDevice(),
        },
        result: undefined,
    },
    {
        description: `with unacquired device`,
        state: {
            device: getSuiteDevice({
                type: 'unacquired',
                connected: true,
            }),
        },
        result: undefined,
    },
    {
        description: `with device which already has state`,
        state: {
            device: getSuiteDevice({
                connected: true,
                state: '012345',
            }),
        },
        result: undefined,
    },
    {
        description: `with device in unexpected mode`,
        state: {
            device: getSuiteDevice({
                connected: true,
                mode: 'bootloader',
            }),
        },
        result: undefined,
    },
    {
        description: `with device which needs FW update`,
        suiteState: {
            device: getSuiteDevice({
                connected: true,
                firmware: 'required',
            }),
        },
        result: undefined,
    },
    {
        description: `success`,
        suiteState: {
            device: getSuiteDevice({
                connected: true,
            }),
        },
        result: SUITE.AUTH_DEVICE,
    },
    {
        description: `duplicate detected`,
        suiteState: {
            device: getSuiteDevice({
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
            device: getSuiteDevice({
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
            device: getSuiteDevice({
                connected: true,
            }),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'getDeviceState error',
            },
        },
        result: NOTIFICATION.TOAST,
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
            device: getSuiteDevice(),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'getDeviceState error',
            },
        },
        result: {
            type: SUITE.RECEIVE_AUTH_CONFIRM,
            success: false,
        },
    },
    {
        description: `cancelled getDeviceState`,
        state: {
            device: getSuiteDevice(),
        },
        getDeviceState: {
            success: false,
            payload: {
                error: 'auth-confirm-cancel',
            },
        },
        result: {
            type: SUITE.FORGET_DEVICE,
        },
    },
    {
        description: `mismatch`,
        state: {
            device: getSuiteDevice({ state: 'ABCD' }),
        },
        result: {
            type: SUITE.RECEIVE_AUTH_CONFIRM,
            success: false,
        },
    },
    {
        description: `success`,
        state: {
            device: getSuiteDevice({ instance: 1, state: 'state@device-id:1' }),
        },
        result: {
            type: SUITE.RECEIVE_AUTH_CONFIRM,
            success: true,
        },
    },
];

const createDeviceInstance = [
    {
        description: `with unacquired device`,
        state: {
            device: getSuiteDevice({
                type: 'unacquired',
                connected: true,
            }),
        },
        result: undefined,
    },
    {
        description: `without passphrase_protection`,
        state: {
            device: getSuiteDevice({
                connected: true,
            }),
        },
        result: SUITE.CREATE_DEVICE_INSTANCE,
    },
    {
        description: `without passphrase_protection and trezor-connect error`,
        state: {
            device: getSuiteDevice({
                connected: true,
            }),
        },
        applySettings: {
            success: false,
            payload: {
                error: 'applySettings error',
            },
        },
        result: NOTIFICATION.TOAST,
    },
    {
        description: `with passphrase_protection enabled`,
        state: {
            device: getSuiteDevice(
                {
                    connected: true,
                },
                {
                    passphrase_protection: true,
                },
            ),
        },
        applySettings: {
            success: false,
            payload: {
                error: 'applySettings error',
            },
        },
        result: SUITE.CREATE_DEVICE_INSTANCE,
    },
];

const switchDuplicatedDevice = [
    {
        description: `success`,
        state: {
            suite: {
                device: getSuiteDevice({
                    instance: 1,
                }),
            },
            devices: [SUITE_DEVICE],
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
    observeSelectedDevice,
    acquireDevice,
    authorizeDevice,
    authConfirm,
    createDeviceInstance,
    switchDuplicatedDevice,
};
