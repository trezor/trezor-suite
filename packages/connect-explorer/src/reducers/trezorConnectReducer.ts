import type { ConnectOptions, MethodAction, TrezorConnectAction } from '../types/actions';
import { ON_CHANGE_CONNECT_OPTIONS, ON_INIT_ERROR, ON_INIT_START } from '../types/actions';

type Action = MethodAction | TrezorConnectAction;

export type ConnectState = {
    options?: ConnectOptions;
    isInitializing: boolean;
    isInitSuccess: boolean;
    initError?: string;
};

export type ConnectRootState = {
    connect: ConnectState;
};

const initialState: ConnectState = {
    options: undefined,
    isInitializing: false,
    isInitSuccess: false,
    initError: undefined,
};

export default function connect(state: ConnectState = initialState, action: Action): ConnectState {
    switch (action.type) {
        case ON_INIT_START:
            return {
                ...state,
                isInitializing: true,
                initError: undefined,
            };
        case ON_CHANGE_CONNECT_OPTIONS:
            return {
                ...state,
                initError: undefined,
                isInitializing: false,
                isInitSuccess: true,
                options: action.payload,
            };
        case ON_INIT_ERROR:
            return {
                ...state,
                initError: action.payload,
                isInitializing: false,
                isInitSuccess: false,
            };
        default:
            return state;
    }
}
