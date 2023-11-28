import { testMocks } from '@suite-common/test-utils';
import { DEVICE, UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';

const { getConnectDevice, getSuiteDevice } = testMocks;
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
        description: 'Disconnect device, modal is opened (user context) and should be closed',
        initialState: {
            context: MODAL.CONTEXT_USER,
            payload: {
                type: 'application-log',
            },
        },
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
        description: 'UI.REQUEST_WORD',
        initialState: undefined,
        actions: [
            {
                type: UI.REQUEST_WORD,
                payload: {
                    device: CONNECT_DEVICE,
                    type: 'WordRequestType_Plain',
                },
            },
        ],
        result: {
            context: MODAL.CONTEXT_DEVICE,
            device: CONNECT_DEVICE,
            windowType: 'WordRequestType_Plain',
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
            context: MODAL.CONTEXT_DEVICE_CONFIRMATION,
            windowType: 'no-backup',
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
        description: 'MODAL.OPEN_USER_CONTEXT',
        initialState: undefined,
        actions: [
            {
                type: MODAL.OPEN_USER_CONTEXT,
                payload: {
                    type: 'application-log',
                },
            },
        ],
        result: {
            context: MODAL.CONTEXT_USER,
            payload: {
                type: 'application-log',
            },
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
