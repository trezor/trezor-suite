import produce from 'immer';
import { TRANSPORT, IFRAME } from 'trezor-connect';
import { SUITE, STORAGE, ROUTER } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import { ObjectValues } from '@suite/types/utils';
import { Action, TrezorDevice } from '@suite-types';

type Lock = ObjectValues<typeof SUITE.LOCK_TYPE>;

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
    locks: Lock[];
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
    mobile?: boolean;
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
    locks: [],
};

const changeLock = (draft: SuiteState, lock: Lock, enabled: boolean) => {
    if (enabled) {
        draft.locks.push(lock);
    } else {
        const index = draft.locks.lastIndexOf(lock);
        draft.locks.splice(index, 1);
    }
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

            case ROUTER.LOCATION_CHANGE:
                draft.showSidebar = false;
                break;

            case SUITE.TOGGLE_SIDEBAR:
                draft.showSidebar = !draft.showSidebar;
                break;

            case SUITE.ONLINE_STATUS:
                draft.online = action.payload;
                break;

            case SUITE.LOCK_UI:
                changeLock(draft, SUITE.LOCK_TYPE.UI, action.payload);
                break;

            case SUITE.LOCK_DEVICE:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, action.payload);
                break;

            case SUITE.LOCK_ROUTER:
                changeLock(draft, SUITE.LOCK_TYPE.ROUTER, action.payload);
                break;

            case DISCOVERY.START:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, true);
                break;
            case DISCOVERY.STOP:
            case DISCOVERY.COMPLETE:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, false);
                break;

            case IFRAME.LOADED:
                draft.platform = action.payload.browser;
                break;
            // no default
        }
    });
};
