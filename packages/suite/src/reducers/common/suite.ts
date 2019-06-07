import { TRANSPORT } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { Action, TrezorDevice } from '@suite/types';

interface SuiteState {
    loading: boolean;
    loaded: boolean;
    error?: string;
    transport?: Transport;
    device?: TrezorDevice;
    language: string;
    messages: { [key: string]: any };
    deviceMenuOpened: boolean;
}

interface Transport {
    type?: string;
    bridge: {
        version: [];
        directory: '';
        packages: [];
        changelog: [];
    };
}

const initialState: SuiteState = {
    loading: true,
    loaded: false,
    language: 'en',
    messages: {},
    deviceMenuOpened: false,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    switch (action.type) {
        case SUITE.INIT:
            return initialState;
        case SUITE.READY:
            return {
                ...state,
                loading: false,
                loaded: true,
            };
        case SUITE.ERROR:
            return {
                ...state,
                loading: false,
                loaded: false,
                error: action.error,
            };
        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
            return {
                ...state,
                device: action.payload,
            };

        case SUITE.SET_LANGUAGE:
            return {
                ...state,
                language: action.locale,
                messages: action.messages,
            };

        case SUITE.TOGGLE_DEVICE_MENU:
            return {
                ...state,
                deviceMenuOpened: action.opened,
            };

        case TRANSPORT.START:
            return {
                ...state,
                transport: action.payload,
            };
        case TRANSPORT.ERROR:
            return {
                ...state,
                transport: {
                    bridge: action.payload.bridge,
                },
            };
        default:
            return state;
    }
};
