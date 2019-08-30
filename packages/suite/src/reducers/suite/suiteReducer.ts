import { TRANSPORT } from 'trezor-connect';
import { SUITE, STORAGE } from '@suite-actions/constants';
import produce from 'immer';
import { Action, TrezorDevice } from '@suite-types';

export interface SuiteState {
    initialRun: boolean;
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
    routerLocked: boolean;
}

interface Transport {
    type?: string;
    version?: string;
    outdated?: boolean;
    bridge: {
        version: number[];
        directory: string;
        packages: {
            platform: string;
            name: string;
            url: string;
        }[];
        changelog: string;
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
    initialRun: true,
    online: true,
    loading: false,
    loaded: false,
    language: 'en',
    messages: {},
    deviceMenuOpened: false,
    showSidebar: undefined,
    uiLocked: false,
    routerLocked: false,
};

export default (state: SuiteState = initialState, action: Action): SuiteState => {
    return produce(state, draft => {
        switch (action.type) {
            case SUITE.INIT:
                draft.loading = true;
                break;

            case STORAGE.LOADED:
                draft.initialRun = action.payload.suite.initialRun;
                draft.language = action.payload.suite.language;
                break;

            case SUITE.READY:
                draft.loading = false;
                draft.loaded = true;
                break;

            case SUITE.ERROR:
                draft.loading = false;
                draft.loaded = false;
                draft.error = action.error;
                break;

            case SUITE.INITIAL_RUN_COMPLETED:
                draft.initialRun = false;
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
                draft.deviceMenuOpened = action.payload;
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
                draft.online = action.payload;
                break;

            case SUITE.LOCK_UI:
                draft.uiLocked = action.payload;
                break;

            case SUITE.LOCK_ROUTER:
                draft.routerLocked = action.payload;
                break;

            case 'iframe-loaded':
                draft.platform = action.payload.browser;
                break;
            // no default
        }
    });
};
