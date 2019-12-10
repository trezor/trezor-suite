import { DEVICE, UI } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { RECEIVE } from '@wallet-actions/constants';

const { getConnectDevice, getSuiteDevice } = global.JestMocks;
// Default devices
const CONNECT_DEVICE = getConnectDevice({
    path: '1',
});
const SUITE_DEVICE = getSuiteDevice({
    path: '1',
});

const initialState = {
    context: MODAL.CONTEXT_NONE,
};
const deviceContextState = {
    context: MODAL.CONTEXT_DEVICE,
    device: SUITE_DEVICE,
};

export default [
    {
        description: 'Connect device, modal not opened',
        initialState,
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: initialState,
    },
    {
        description: 'Connect device, modal is opened and should be closed',
        initialState: {
            context: MODAL.CONTEXT_SCAN_QR,
        },
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: initialState,
    },
    {
        description: 'Connect device, modal is opened and should not be closed',
        initialState: deviceContextState,
        actions: [
            {
                type: DEVICE.CONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: deviceContextState,
    },
    {
        description: 'Disconnect device, modal is opened and should be closed',
        initialState: deviceContextState,
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: initialState,
    },
    {
        description: 'Disconnect device, modal is opened and should not be closed',
        initialState: {
            context: MODAL.CONTEXT_DEVICE,
            device: getConnectDevice({
                path: '2',
            }),
        },
        actions: [
            {
                type: DEVICE.DISCONNECT,
                payload: CONNECT_DEVICE,
            },
        ],
        result: {
            context: MODAL.CONTEXT_DEVICE,
            device: getConnectDevice({
                path: '2',
            }),
        },
    },
    {
        description: 'UI.REQUEST_PIN',
        initialState,
        actions: [
            {
                type: UI.REQUEST_PIN,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI.REQUEST_PIN,
        },
    },
    {
        description: 'UI.INVALID_PIN',
        initialState,
        actions: [
            {
                type: UI.INVALID_PIN,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI.INVALID_PIN,
        },
    },
    {
        description: 'UI.REQUEST_PASSPHRASE',
        initialState,
        actions: [
            {
                type: UI.REQUEST_PASSPHRASE,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI.REQUEST_PASSPHRASE,
        },
    },
    {
        description: 'UI.REQUEST_BUTTON',
        initialState,
        actions: [
            {
                type: UI.REQUEST_BUTTON,
                payload: {
                    device: CONNECT_DEVICE,
                    code: 'ButtonRequest_SignTx',
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: 'ButtonRequest_SignTx',
        },
    },
    {
        description: 'UI.REQUEST_CONFIRMATION',
        initialState,
        actions: [
            {
                type: UI.REQUEST_CONFIRMATION,
                payload: {
                    view: 'no-backup',
                },
            },
        ],
        result: {
            context: MODAL.CONTEXT_CONFIRMATION,
            windowType: 'no-backup',
        },
    },
    {
        description: 'RECEIVE.REQUEST_UNVERIFIED',
        initialState,
        actions: [
            {
                type: RECEIVE.REQUEST_UNVERIFIED,
                device: SUITE_DEVICE,
                addressPath: `m/44'/0'/0'/0/0`,
            },
        ],
        result: {
            ...deviceContextState,
            windowType: RECEIVE.REQUEST_UNVERIFIED,
            addressPath: `m/44'/0'/0'/0/0`,
        },
    },
    {
        description: 'SUITE.REQUEST_REMEMBER_DEVICE',
        initialState,
        actions: [
            {
                type: SUITE.REQUEST_REMEMBER_DEVICE,
                payload: SUITE_DEVICE,
            },
        ],
        result: {
            ...deviceContextState,
            windowType: SUITE.REQUEST_REMEMBER_DEVICE,
        },
    },
    {
        description: 'SUITE.REQUEST_DEVICE_INSTANCE',
        initialState,
        actions: [
            {
                type: SUITE.REQUEST_DEVICE_INSTANCE,
                payload: SUITE_DEVICE,
            },
        ],
        result: {
            ...deviceContextState,
            windowType: SUITE.REQUEST_DEVICE_INSTANCE,
        },
    },
    {
        description: 'SUITE.REQUEST_PASSPHRASE_MODE',
        initialState,
        actions: [
            {
                type: SUITE.REQUEST_PASSPHRASE_MODE,
                payload: SUITE_DEVICE,
            },
        ],
        result: {
            ...deviceContextState,
            windowType: SUITE.REQUEST_PASSPHRASE_MODE,
        },
    },
    {
        description: 'UI.CLOSE_UI_WINDOW',
        initialState: deviceContextState,
        actions: [
            {
                type: UI.CLOSE_UI_WINDOW,
            },
        ],
        result: initialState,
    },
    {
        description: 'MODAL.CLOSE',
        initialState: deviceContextState,
        actions: [
            {
                type: MODAL.CLOSE,
            },
        ],
        result: initialState,
    },
    {
        description: 'SUITE.FORGET_DEVICE',
        initialState: deviceContextState,
        actions: [
            {
                type: SUITE.FORGET_DEVICE,
            },
        ],
        result: initialState,
    },
    {
        description: 'SUITE.FORGET_DEVICE_INSTANCE',
        initialState: deviceContextState,
        actions: [
            {
                type: SUITE.FORGET_DEVICE_INSTANCE,
            },
        ],
        result: initialState,
    },
    {
        description: 'SUITE.REMEMBER_DEVICE',
        initialState: deviceContextState,
        actions: [
            {
                type: SUITE.REMEMBER_DEVICE,
            },
        ],
        result: initialState,
    },
    {
        description: 'MODAL.OPEN_SCAN_QR',
        initialState: undefined,
        actions: [
            {
                type: MODAL.OPEN_SCAN_QR,
            },
        ],
        result: {
            context: MODAL.CONTEXT_SCAN_QR,
        },
    },
    {
        description: 'Unhandled action',
        initialState: deviceContextState,
        actions: [
            {
                type: 'unhandled-action',
            },
        ],
        result: deviceContextState,
    },
];
