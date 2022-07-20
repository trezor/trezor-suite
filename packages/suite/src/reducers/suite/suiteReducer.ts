import produce from 'immer';
import { TRANSPORT, TransportInfo } from '@trezor/connect';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { variables } from '@trezor/components';
import { SUITE, STORAGE } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import { Action, TrezorDevice, Lock, TorStatus } from '@suite-types';
import type { Locale } from '@suite-config/languages';
import { isWeb, getWindowWidth } from '@suite-utils/env';
import { ensureLocale } from '@suite-utils/l10n';
import { getNumberFromPixelString } from '@trezor/utils';
import type { OAuthServerEnvironment } from '@suite-types/metadata';
import type { InvityServerEnvironment } from '@wallet-types/invity';

export interface DebugModeOptions {
    invityServerEnvironment?: InvityServerEnvironment;
    oauthServerEnvironment?: OAuthServerEnvironment;
    showDebugMenu: boolean;
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

export type SuiteLifecycle =
    | { status: 'initial' }
    | { status: 'loading' }
    | { status: 'ready' }
    // errors set from connect, should be renamed
    | { status: 'error'; error: string }
    // blocked if the instance cannot upgrade due to older version running,
    // blocking in case instance is running older version thus blocking other instance
    | { status: 'db-error'; error: 'blocking' | 'blocked' };

export interface Flags {
    initialRun: boolean; // true on very first launch of Suite, will switch to false after completing onboarding process
    // is not saved to storage at the moment, so for simplicity of types set to be optional now
    // recoveryCompleted: boolean;
    // pinCompleted: boolean;
    // passphraseCompleted: boolean;
    bech32BannerClosed: boolean; // banner in account view informing about advantages of using Bech32
    taprootBannerClosed: boolean; // banner in account view informing about advantages of using Taproot
    firmwareTypeBannerClosed: boolean; // banner in Crypto settings suggesting switching firmware type
    discreetModeCompleted: boolean; // dashboard UI, user tried discreet mode
    securityStepsHidden: boolean; // dashboard UI
    dashboardGraphHidden: boolean; // dashboard UI
    dashboardAssetsGridMode: boolean; // dashboard UI
}

export interface SuiteSettings {
    theme: {
        variant: Exclude<SuiteThemeVariant, 'system'>;
    };
    language: Locale;
    btcOnlyFirmware: boolean;
    torOnionLinks: boolean;
    debug: DebugModeOptions;
    autodetect: AutodetectSettings;
}

export interface SuiteState {
    online: boolean;
    torStatus: TorStatus;
    lifecycle: SuiteLifecycle;
    transport?: Partial<TransportInfo>;
    device?: TrezorDevice;
    locks: Lock[];
    flags: Flags;
    settings: SuiteSettings;
}

const initialState: SuiteState = {
    online: true,
    torStatus: TorStatus.Disabled,
    lifecycle: { status: 'initial' },
    locks: [],
    flags: {
        initialRun: true,
        // recoveryCompleted: false;
        // pinCompleted: false;
        // passphraseCompleted: false;
        discreetModeCompleted: false,
        bech32BannerClosed: false,
        taprootBannerClosed: false,
        firmwareTypeBannerClosed: false,
        securityStepsHidden: false,
        dashboardGraphHidden: false,
        dashboardAssetsGridMode:
            getWindowWidth() < getNumberFromPixelString(variables.SCREEN_SIZE.SM),
    },
    settings: {
        theme: {
            variant: 'light',
        },
        language: ensureLocale('en'),
        btcOnlyFirmware: false,
        torOnionLinks: isWeb(),
        debug: {
            invityServerEnvironment: undefined,
            showDebugMenu: false,
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
            case STORAGE.LOAD:
                draft.flags = {
                    ...draft.flags,
                    ...action.payload.suiteSettings?.flags,
                };
                draft.settings = {
                    ...draft.settings,
                    ...action.payload.suiteSettings?.settings,
                };
                break;
            case STORAGE.ERROR:
                draft.lifecycle = { status: 'db-error', error: action.payload };
                break;
            case SUITE.INIT:
                draft.lifecycle = { status: 'loading' };
                break;
            case SUITE.READY:
                draft.lifecycle = { status: 'ready' };
                break;

            case SUITE.ERROR:
                draft.lifecycle = { status: 'error', error: action.error };
                break;

            case SUITE.SELECT_DEVICE:
            case SUITE.UPDATE_SELECTED_DEVICE:
                draft.device = action.payload;
                break;

            case SUITE.SET_LANGUAGE:
                draft.settings.language = action.locale;
                break;

            case SUITE.SET_DEBUG_MODE:
                draft.settings.debug = { ...draft.settings.debug, ...action.payload };
                break;

            case SUITE.SET_FLAG:
                setFlag(draft, action.key, action.value);
                break;

            case SUITE.SET_THEME:
                draft.settings.theme.variant = action.variant;
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
                draft.torStatus = action.payload;
                break;

            case SUITE.ONION_LINKS:
                draft.settings.torOnionLinks = action.payload;
                break;

            case SUITE.BTC_ONLY_FIRMWARE:
                draft.settings.btcOnlyFirmware = action.payload;
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

            case SUITE.REQUEST_DEVICE_RECONNECT:
                if (draft.device) {
                    draft.device.reconnectRequested = true;
                }
                break;

            // no default
        }
    });

export default suiteReducer;
