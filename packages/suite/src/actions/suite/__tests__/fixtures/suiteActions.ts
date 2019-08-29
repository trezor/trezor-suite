/* eslint-disable @typescript-eslint/camelcase */
import { DEVICE, TRANSPORT } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { NOTIFICATION } from '@wallet-actions/constants';
import * as suiteActions from '../../suiteActions';

const { getSuiteDevice, getConnectDevice } = global.JestMocks;

const SUITE_DEVICE = getSuiteDevice();
const SUITE_DEVICE_UNACQUIRED = getSuiteDevice({
    type: 'unacquired',
});
const CONNECT_DEVICE = getConnectDevice();

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
                uiLocked: true,
            },
            {
                uiLocked: false,
            },
        ],
    },
    {
        description: `lockRouter (true/false)`,
        actions: [suiteActions.lockRouter(true), suiteActions.lockRouter(false)],
        result: [
            {
                routerLocked: true,
            },
            {
                routerLocked: false,
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
        description: `iframe-loaded`,
        actions: [
            {
                type: 'iframe-loaded',
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

const selectDevice = [
    {
        description: `with uiLocked`,
        state: {
            suite: {
                uiLocked: true,
            },
        },
        device: SUITE_DEVICE,
    },
    {
        description: `with routerLocked`,
        state: {
            suite: {
                routerLocked: true,
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
        },
        device: CONNECT_DEVICE,
        result: {
            payload: undefined,
        },
    },
    {
        description: `disconnected selected device with routerLocked`,
        state: {
            suite: {
                device: SUITE_DEVICE,
                routerLocked: true,
            },
            devices: [
                SUITE_DEVICE,
                getSuiteDevice({
                    path: '2',
                }),
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
                getSuiteDevice({
                    path: '4',
                }),
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
                getSuiteDevice({
                    path: '2',
                }),
                getSuiteDevice({
                    connected: true,
                    path: '3',
                    ts: 1,
                }),
                getSuiteDevice({
                    connected: true,
                    path: '4',
                    ts: 2,
                }),
            ],
        },
        device: CONNECT_DEVICE,
        result: {
            payload: getSuiteDevice({
                connected: true,
                path: '4',
                ts: 2,
            }),
        },
    },
    {
        description: `switch to recently used device`,
        state: {
            suite: {
                device: SUITE_DEVICE,
            },
            devices: [
                getSuiteDevice({
                    path: '2',
                    ts: 2,
                }),
                getSuiteDevice({
                    path: '3',
                    ts: 3,
                }),
                getSuiteDevice({
                    path: '4',
                    ts: 1,
                }),
            ],
        },
        device: CONNECT_DEVICE,
        result: {
            payload: getSuiteDevice({
                path: '3',
                ts: 3,
            }),
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
        result: SUITE.LOCK_UI,
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
        result: undefined,
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
        result: SUITE.REQUEST_PASSPHRASE_MODE,
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
    selectDevice,
    handleDeviceConnect,
    handleDeviceDisconnect,
    observeSelectedDevice,
    acquireDevice,
    requestPassphraseMode,
    authorizeDevice,
};
