import { TRANSPORT } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { Action, TrezorDevice } from '@suite-types/index';

interface SuiteState {
    online: boolean;
    loading: boolean;
    loaded: boolean;
    error?: string;
    transport?: Transport;
    device?: TrezorDevice;
    language: string;
    messages: { [key: string]: any };
    deviceMenuOpened: boolean;
    showSidebar?: boolean;
    platform?: Platform;
}

interface Transport {
    type?: string;
    version?: string;
    bridge: {
        version: [];
        directory: '';
        packages: [];
        changelog: [];
    };
}

interface Platform {
    mobile: boolean | undefined; // todo: there is maybe a bug in connect, mobile shouldnt be undefined imho
    name: string;
    osname: string;
    outdated: boolean;
    supported: boolean;
}

const initialState: SuiteState = {
    online: true, // correct value will be set on SUITE_INIT
    loading: true,
    loaded: false,
    language: 'en',
    messages: {},
    deviceMenuOpened: false,
    showSidebar: undefined,
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
        case SUITE.TOGGLE_SIDEBAR:
            return {
                ...state,
                showSidebar: !state.showSidebar,
            };

        case SUITE.ONLINE_STATUS:
            return {
                ...state,
                online: action.online,
            };

        case 'iframe-loaded':
            return {
                ...state,
                platform: action.payload.browser,
            };
        default:
            return state;
    }
};
