import type { ConnectOptions, MethodAction, TrezorConnectAction } from '../types/actions';
import {
    ON_CHANGE_CONNECT_OPTION,
    ON_CHANGE_CONNECT_OPTIONS,
    ON_HANDSHAKE_CONFIRMED,
    ON_INIT_ERROR,
} from '../types/actions';
import type { Field } from '../types/common';

type Action = MethodAction | TrezorConnectAction;

export type ConnectState = {
    options?: ConnectOptions;
    isHandshakeConfirmed: boolean;
    isInitSuccess: boolean;
    initError?: string;
};

const initialState: ConnectState = {
    options: undefined,
    isHandshakeConfirmed: false,
    isInitSuccess: false,
    initError: undefined,
};

const onOptionChange = <T>(state: ConnectState, field: Field<T>, value: T): ConnectState => {
    const newState = {
        ...state,
    };
    if (!newState.options) {
        newState.options = {
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/connect-explorer',
                appName: 'Trezor Connect Explorer',
            },
        };
    }

    (newState.options as any)[field.name] = value;

    return newState;
};

export default function connect(state: ConnectState = initialState, action: Action): ConnectState {
    switch (action.type) {
        case ON_CHANGE_CONNECT_OPTION:
            return onOptionChange(state, action.payload.option, action.payload.value);

        case ON_CHANGE_CONNECT_OPTIONS:
            return {
                ...state,
                initError: undefined,
                isInitSuccess: true,
                options: action.payload,
            };
        case ON_HANDSHAKE_CONFIRMED:
            return {
                ...state,
                isHandshakeConfirmed: true,
            };
        case ON_INIT_ERROR:
            return {
                ...state,
                initError: action.payload,
                isInitSuccess: false,
            };
        default:
            return state;
    }
}
