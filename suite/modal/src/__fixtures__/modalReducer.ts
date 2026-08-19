import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { DEVICE, UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import {
    MODAL_CLOSE,
    MODAL_CONTEXT_DEVICE,
    MODAL_CONTEXT_DEVICE_CONFIRMATION,
    MODAL_CONTEXT_NONE,
    MODAL_CONTEXT_USER,
    MODAL_OPEN_USER_CONTEXT,
} from '../constants';

// Default devices
const CONNECT_DEVICE = mockConnectDevice({
    path: '1',
});
const SUITE_DEVICE = mockSuiteDevice({
    path: '1',
});

const initialState = {
    context: MODAL_CONTEXT_NONE,
};
const deviceContextState = {
    context: MODAL_CONTEXT_DEVICE,
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
            context: MODAL_CONTEXT_USER,
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
            context: MODAL_CONTEXT_DEVICE,
            device: mockConnectDevice({
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
            context: MODAL_CONTEXT_DEVICE,
            device: mockConnectDevice({
                path: '2',
            }),
        },
    },
    {
        description: 'UI_REQUESTS.REQUEST_PIN',
        initialState,
        actions: [
            {
                type: UI_REQUESTS.REQUEST_PIN,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI_REQUESTS.REQUEST_PIN,
        },
    },
    {
        description: 'UI_EVENTS.INVALID_PIN',
        initialState,
        actions: [
            {
                type: UI_EVENTS.INVALID_PIN,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI_EVENTS.INVALID_PIN,
        },
    },
    {
        description: 'UI_REQUESTS.REQUEST_PASSPHRASE',
        initialState,
        actions: [
            {
                type: UI_REQUESTS.REQUEST_PASSPHRASE,
                payload: {
                    device: CONNECT_DEVICE,
                },
            },
        ],
        result: {
            ...deviceContextState,
            device: CONNECT_DEVICE,
            windowType: UI_REQUESTS.REQUEST_PASSPHRASE,
        },
    },
    {
        description: 'UI_EVENTS.BUTTON_REQUEST',
        initialState,
        actions: [
            {
                type: UI_EVENTS.BUTTON_REQUEST,
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
        description: 'UI_REQUESTS.REQUEST_WORD',
        initialState: undefined,
        actions: [
            {
                type: UI_REQUESTS.REQUEST_WORD,
                payload: {
                    device: CONNECT_DEVICE,
                    type: 'WordRequestType_Plain',
                },
            },
        ],
        result: {
            context: MODAL_CONTEXT_DEVICE,
            device: CONNECT_DEVICE,
            windowType: 'WordRequestType_Plain',
        },
    },
    {
        description: 'UI_REQUESTS.REQUEST_CONFIRMATION',
        initialState,
        actions: [
            {
                type: UI_REQUESTS.REQUEST_CONFIRMATION,
                payload: {
                    view: 'no-backup',
                },
            },
        ],
        result: {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: 'no-backup',
        },
    },
    {
        description: 'UI_EVENTS.CLOSE_UI_WINDOW',
        initialState: deviceContextState,
        actions: [
            {
                type: UI_EVENTS.CLOSE_UI_WINDOW,
            },
        ],
        result: initialState,
    },
    {
        description:
            'UI_EVENTS.CLOSE_UI_WINDOW with preserve=true keeps device context modal open (preserve cleared)',
        initialState: { ...deviceContextState, preserve: true },
        actions: [
            {
                type: UI_EVENTS.CLOSE_UI_WINDOW,
            },
        ],
        result: { ...deviceContextState, preserve: false },
    },
    {
        description:
            'UI_EVENTS.CLOSE_UI_WINDOW with preserve=true keeps device confirmation context modal open (preserve cleared)',
        initialState: {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: 'no-backup' as const,
            preserve: true,
        },
        actions: [
            {
                type: UI_EVENTS.CLOSE_UI_WINDOW,
            },
        ],
        result: {
            context: MODAL_CONTEXT_DEVICE_CONFIRMATION,
            windowType: 'no-backup',
            preserve: false,
        },
    },
    {
        description: 'UI_EVENTS.CLOSE_UI_WINDOW with preserve=true keeps user context modal open',
        initialState: {
            context: MODAL_CONTEXT_USER,
            payload: { type: 'application-log' as const },
            preserve: true,
        },
        actions: [
            {
                type: UI_EVENTS.CLOSE_UI_WINDOW,
            },
        ],
        result: {
            context: MODAL_CONTEXT_USER,
            payload: { type: 'application-log' },
            preserve: true,
        },
    },
    {
        description: 'MODAL_CLOSE',
        initialState: deviceContextState,
        actions: [
            {
                type: MODAL_CLOSE,
            },
        ],
        result: initialState,
    },
    {
        description: 'MODAL_OPEN_USER_CONTEXT',
        initialState: undefined,
        actions: [
            {
                type: MODAL_OPEN_USER_CONTEXT,
                payload: {
                    type: 'application-log',
                },
            },
        ],
        result: {
            context: MODAL_CONTEXT_USER,
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
