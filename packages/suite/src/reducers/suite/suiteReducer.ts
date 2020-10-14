import produce from 'immer';
import { TRANSPORT, TransportInfo } from 'trezor-connect';
import { SUITE, STORAGE } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import { Action, TrezorDevice, Lock } from '@suite-types';
import { LANGUAGES } from '@suite-config';
import { isWeb } from '@suite-utils/env';

export interface DebugModeOptions {
    translationMode: boolean;
    invityAPIUrl?: string;
    showDebugMenu: boolean;
    bridgeDevMode: boolean;
}

interface Flags {
    initialRun: boolean;
    // is not saved to storage at the moment, so for simplicity of types set to be optional now
    initialWebRun?: boolean;
    // recoveryCompleted: boolean;
    // pinCompleted: boolean;
    // passphraseCompleted: boolean;
    discreetModeCompleted: boolean;
}

interface SuiteSettings {
    language: typeof LANGUAGES[number]['code'];
    debug: DebugModeOptions;
}

export interface SuiteState {
    online: boolean;
    loading: boolean;
    loaded: boolean;
    error?: string;
    transport?: Partial<TransportInfo>;
    device?: TrezorDevice;
    messages: { [key: string]: any };
    locks: Lock[];
    flags: Flags;
    settings: SuiteSettings;
}

const initialState: SuiteState = {
    online: true,
    loading: false,
    loaded: false,
    messages: {},
    locks: [],
    flags: {
        initialRun: true,
        // on web, there is another preceding initialWebRun, that shows 'download' desktop
        initialWebRun: isWeb(),
        // recoveryCompleted: false;
        // pinCompleted: false;
        // passphraseCompleted: false;
        discreetModeCompleted: false,
    },
    settings: {
        language: 'en',
        debug: {
            invityAPIUrl: undefined,
            showDebugMenu: false,
            translationMode: false,
            bridgeDevMode: false,
        },
    },
};

const changeLock = (draft: SuiteState, lock: Lock, enabled: boolean) => {
    if (enabled) {
        draft.locks.push(lock);
    } else {
        const index = draft.locks.lastIndexOf(lock);
        draft.locks.splice(index, 1);
    }
};

const setFlag = (draft: SuiteState, key: keyof Flags, value: boolean) => {
    draft.flags[key] = value;
};

const suiteReducer = (state: SuiteState = initialState, action: Action): SuiteState => {
    return produce(state, draft => {
        switch (action.type) {
            case SUITE.INIT:
                draft.loading = true;
                break;

            case STORAGE.LOADED:
                draft.flags = action.payload.suite.flags;
                draft.settings = action.payload.suite.settings;
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

            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                draft.device = action.payload;
                break;

            case SUITE.SET_LANGUAGE:
                draft.settings.language = action.locale;
                draft.messages = action.messages;
                break;

            case SUITE.SET_DEBUG_MODE:
                draft.settings.debug = { ...draft.settings.debug, ...action.payload };
                break;

            case SUITE.SET_FLAG:
                setFlag(draft, action.key, action.value);
                break;

            case TRANSPORT.START:
                draft.transport = action.payload;
                break;

            case TRANSPORT.ERROR:
                draft.transport = {
                    bridge: action.payload.bridge,
                };
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

            // no default
        }
    });
};

export default suiteReducer;
