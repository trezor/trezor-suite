/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE, TRANSPORT, IFRAME } from 'trezor-connect';
import { SUITE, STORAGE, NOTIFICATION } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as suiteActions from '../../suiteActions';

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
                        initialRun: false,
                        language: 'cs',
                    },
                },
            },
        ],
        result: [
            {
                initialRun: false,
                language: 'cs',
            },
        ],
    },
    {
        description: `toggleDeviceMenu (true/false)`,
        actions: [suiteActions.toggleDeviceMenu(true), suiteActions.toggleDeviceMenu(false)],
        result: [
            {
                deviceMenuOpened: true,
            },
            {
                deviceMenuOpened: false,
            },
        ],
    },
    {
        description: `toggleSidebar (true/false)`,
        actions: [suiteActions.toggleSidebar(), suiteActions.toggleSidebar()],
        result: [
            {
                showSidebar: true,
            },
            {
                showSidebar: false,
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
        description: `requestForgetDevice (just for coverage)`,
        actions: [suiteActions.requestForgetDevice(getSuiteDevice())],
        result: [
            {
                online: true,
            },
        ],
    },
    {
        description: `requestDeviceInstance (just for coverage)`,
        actions: [suiteActions.requestDeviceInstance(getSuiteDevice())],
        result: [
            {
                online: true,
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
                language: 'cz',
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
    {
        description: `IFRAME.LOADED`,
        actions: [
            {
                type: IFRAME.LOADED,
                payload: {
                    browser: {
                        name: 'env',
                    },
                },
            },
        ],
        result: [
            {
                platform: {
                    name: 'env',
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
            initialRun: false,
        },
    },
];

const selectDevice = [
    {
        description: `with ui locked`,
        state: {
            suite: {
                locks: [SUITE.LOCK_TYPE.UI],
            },
        },
        device: SUITE_DEVICE,
    },
    {
        description: `with router locked`,
        state: {
            suite: {
                locks: [SUITE.LOCK_TYPE.ROUTER, SUITE.LOCK_TYPE.DEVICE],
            },
        },
        device: SUITE_DEVICE,
    },
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
        description: `redirect to onboarding (trezor-connect Device)`,
        state: {
            devices: [
                getSuiteDevice({
                    path: '1',
                    mode: 'initialize',
                }),
            ],
        },
        device: getConnectDevice({
            path: '1',
            mode: 'initialize',
        }),
        result: {
            payload: getSuiteDevice({
                path: '1',
                mode: 'initialize',
            }),
            router: {
                app: 'onboarding',
            },
        },
    },
    {
        description: `redirect to onboarding (@suite TrezorDevice)`,
        state: {
            devices: [
                getSuiteDevice({
                    path: '1',
                    mode: 'initialize',
                }),
            ],
        },
        device: getSuiteDevice({
            path: '1',
            mode: 'initialize',
        }),
        result: {
            payload: getSuiteDevice({
                path: '1',
                mode: 'initialize',
            }),
            router: {
                app: 'onboarding',
            },
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
            device: SUITE_DEVICE,
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
        description: `disconnected selected device (3 instances: 1 remembered, 1 with state, 1 stateless which will be removed, remember request)`,
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
                }),
            ],
        },
        device: CONNECT_DEVICE,
        result: {
            type: SUITE.REQUEST_REMEMBER_DEVICE,
            payload: getSuiteDevice({
                state: 'abc',
                instance: 1,
            }),
        },
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
    {
        description: `disconnected selected device with state (remember request)`,
        state: {
            suite: {
                device: getSuiteDevice({
                    path: '1',
                    state: 'abc',
                }),
            },
            devices: [
                getSuiteDevice({
                    path: '1',
                    state: 'abc',
                }),
            ],
        },
        device: CONNECT_DEVICE,
        result: {
            type: SUITE.REQUEST_REMEMBER_DEVICE,
            payload: getSuiteDevice({
                connected: false,
                available: false,
                path: '',
                state: 'abc',
            }),
        },
    },
    {
        description: `disconnected selected device with router locked`,
        state: {
            suite: {
                device: SUITE_DEVICE,
                locks: [SUITE.LOCK_TYPE.ROUTER],
            },
            devices: [
                SUITE_DEVICE,
                getSuiteDevice(
                    {
                        path: '2',
                    },
                    {
                        device_id: '2',
                    },
                ),
            ],
        },
        device: CONNECT_DEVICE,
        result: {
            payload: undefined,
        },
    },
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
        result: NOTIFICATION.ADD,
    },
    {
        description: `without device`,
        state: {},
        result: SUITE.CONNECT_INITIALIZED,
    },
];

const requestPassphraseMode = [
    {
        description: `without device`,
        state: {},
        result: undefined,
    },
    {
        description: `with disconnected device`,
        state: {
            device: SUITE_DEVICE,
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
        state: {
            device: getSuiteDevice({
                connected: true,
                firmware: 'required',
            }),
        },
        result: undefined,
    },
    {
        description: `with device "passphrase_protection" disabled`,
        state: {
            device: getSuiteDevice({
                connected: true,
            }),
        },
        result: SUITE.RECEIVE_PASSPHRASE_MODE,
    },
    {
        description: `with device "passphrase_protection" enabled`,
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
        result: SUITE.RECEIVE_PASSPHRASE_MODE,
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
        state: {
            device: getSuiteDevice({
                connected: true,
                firmware: 'required',
            }),
        },
        result: undefined,
    },
    {
        description: `success`,
        state: {
            device: getSuiteDevice({
                connected: true,
            }),
        },
        result: SUITE.AUTH_DEVICE,
    },
    {
        description: `with TrezorConnect error`,
        state: {
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
        result: NOTIFICATION.ADD,
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
    requestPassphraseMode,
    authorizeDevice,
};
