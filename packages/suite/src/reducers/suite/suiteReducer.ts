import { TRANSPORT } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import produce from 'immer';
import { Action, TrezorDevice } from '@suite-types';

export interface SuiteState {
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
    uiLocked: boolean;
}

interface Transport {
    type?: string;
    version?: string;
    outdated?: boolean;
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
    uiLocked: false,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    return produce(state, draft => {
        switch (action.type) {
            case SUITE.INIT:
                return initialState;

            case SUITE.READY:
                draft.loading = false;
                draft.loaded = true;
                break;

            case SUITE.ERROR:
                draft.loading = false;
                draft.loaded = false;
                draft.error = action.error;
                break;

            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                draft.device = action.payload;
                break;

            case SUITE.SET_LANGUAGE:
                draft.language = action.locale;
                draft.messages = action.messages;
                break;

            case SUITE.TOGGLE_DEVICE_MENU:
                draft.deviceMenuOpened = action.opened;
                break;

            case TRANSPORT.START:
                draft.transport = action.payload;
                break;

            case TRANSPORT.ERROR:
                draft.transport = {
                    bridge: action.payload.bridge,
                };
                break;
            case SUITE.TOGGLE_SIDEBAR:
                draft.showSidebar = !draft.showSidebar;
                break;

            case SUITE.ONLINE_STATUS:
                draft.online = action.online;
                break;

            case SUITE.LOCK_UI:
                draft.uiLocked = action.payload;
                break;

            case 'iframe-loaded':
                draft.platform = action.payload.browser;
                break;
            // no default
        }
    });
};
