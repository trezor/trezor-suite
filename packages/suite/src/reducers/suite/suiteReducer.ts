import produce from 'immer';
import { TRANSPORT, TransportInfo } from 'trezor-connect';
import { variables } from '@trezor/components';
import { SUITE, STORAGE } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import { Action, TrezorDevice, Lock, SuiteThemeColors } from '@suite-types';
import type { Locale } from '@suite-config/languages';
import { isWeb, getWindowWidth } from '@suite-utils/env';
import { ensureLocale } from '@suite-utils/l10n';
import { getNumberFromPxString } from '@trezor/utils';

export interface DebugModeOptions {
    invityAPIUrl?: string;
    showDebugMenu: boolean;
    bridgeDevMode: boolean;
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

interface Flags {
    initialRun: boolean; // true on very first launch of Suite, will switch to false after completing onboarding process
    // is not saved to storage at the moment, so for simplicity of types set to be optional now
    // recoveryCompleted: boolean;
    // pinCompleted: boolean;
    // passphraseCompleted: boolean;
    bech32BannerClosed: boolean; // banner in account view informing about advantages of using Bech32
    taprootBannerClosed: boolean; // banner in account view informing about advantages of using Taproot
    discreetModeCompleted: boolean; // dashboard UI, user tried discreet mode
    securityStepsHidden: boolean; // dashboard UI
    dashboardGraphHidden: boolean; // dashboard UI
    dashboardAssetsGridMode: boolean; // dashboard UI
}

interface SuiteSettings {
    theme: {
        variant: SuiteThemeVariant;
        colors?: SuiteThemeColors;
    };
    language: Locale;
    torOnionLinks: boolean;
    debug: DebugModeOptions;
    autodetect: AutodetectSettings;
}

export interface SuiteState {
    online: boolean;
    tor: boolean;
    loading: boolean;
    storageLoaded: boolean;
    loaded: boolean;
    error?: string; // errors set from connect, should be renamed
    dbError?: 'blocking' | 'blocked' | undefined; // blocked if the instance cannot upgrade due to older version running, blocking in case instance is running older version thus blocking other instance
    transport?: Partial<TransportInfo>;
    device?: TrezorDevice;
    messages: { [key: string]: any };
    locks: Lock[];
    flags: Flags;
    settings: SuiteSettings;
}

const initialState: SuiteState = {
    online: true,
    tor: false,
    loading: false,
    storageLoaded: false,
    loaded: false,
    messages: {},
    locks: [],
    flags: {
        initialRun: true,
        // recoveryCompleted: false;
        // pinCompleted: false;
        // passphraseCompleted: false;
        discreetModeCompleted: false,
        bech32BannerClosed: false,
        taprootBannerClosed: false,
        securityStepsHidden: false,
        dashboardGraphHidden: false,
        dashboardAssetsGridMode: getWindowWidth() < getNumberFromPxString(variables.SCREEN_SIZE.SM),
    },
    settings: {
        theme: {
            variant: 'light',
        },
        language: ensureLocale('en'),
        torOnionLinks: isWeb(),
        debug: {
            invityAPIUrl: undefined,
            showDebugMenu: false,
            bridgeDevMode: false,
        },
        autodetect: {
            language: true,
            theme: true,
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

const suiteReducer = (state: SuiteState = initialState, action: Action): SuiteState =>
    produce(state, draft => {
        switch (action.type) {
            case SUITE.INIT:
                draft.loading = true;
                break;

            case STORAGE.LOADED:
                draft.flags = action.payload.suite.flags;
                draft.settings = action.payload.suite.settings;
                draft.storageLoaded = action.payload.suite.storageLoaded;
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

            case SUITE.SET_DB_ERROR:
                draft.loading = false;
                draft.loaded = false;
                draft.dbError = action.payload;
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

            case SUITE.SET_THEME:
                draft.settings.theme.variant = action.variant;
                draft.settings.theme.colors = action.colors;
                break;

            case SUITE.SET_AUTODETECT:
                draft.settings.autodetect = {
                    ...draft.settings.autodetect,
                    ...action.payload,
                };
                break;

            case TRANSPORT.START:
                draft.transport = action.payload;
                break;

            case TRANSPORT.ERROR:
                draft.transport = {
                    bridge: action.payload.bridge,
                    udev: action.payload.udev,
                };
                break;

            case SUITE.ONLINE_STATUS:
                draft.online = action.payload;
                break;

            case SUITE.TOR_STATUS:
                draft.tor = action.payload;
                break;

            case SUITE.ONION_LINKS:
                draft.settings.torOnionLinks = action.payload;
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

export default suiteReducer;
