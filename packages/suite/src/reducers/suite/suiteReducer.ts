import produce from 'immer';

import { discoveryActions, DeviceRootState, selectDevice } from '@suite-common/wallet-core';
import type { InvityServerEnvironment } from '@suite-common/invity';
import { versionUtils } from '@trezor/utils';
import { isWeb } from '@trezor/env-utils';
import { TRANSPORT, TransportInfo, ConnectSettings } from '@trezor/connect';

import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';
import type { OAuthServerEnvironment } from 'src/types/suite/metadata';
import { ensureLocale } from 'src/utils/suite/l10n';
import type { Locale } from 'src/config/suite/languages';
import { SUITE, STORAGE } from 'src/actions/suite/constants';
import { Action, Lock, TorBootstrap, TorStatus } from 'src/types/suite';
import { getExcludedPrerequisites, getPrerequisiteName } from 'src/utils/suite/prerequisites';
import { RouterRootState, selectRouter } from './routerReducer';
import { Network } from '@suite-common/wallet-config';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { AddressDisplayOptions, WalletType } from '@suite-common/wallet-types';

export interface SuiteRootState {
    suite: SuiteState;
}

export interface DebugModeOptions {
    invityServerEnvironment?: InvityServerEnvironment;
    oauthServerEnvironment?: OAuthServerEnvironment;
    showDebugMenu: boolean;
    checkFirmwareAuthenticity: boolean;
    transports: Extract<NonNullable<ConnectSettings['transports']>[number], string>[];
    isUnlockedBootloaderAllowed: boolean;
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
    taprootBannerClosed: boolean; // banner in account view informing about advantages of using Taproot
    firmwareTypeBannerClosed: boolean; // banner in Crypto settings suggesting switching firmware type
    discreetModeCompleted: boolean; // dashboard UI, user tried discreet mode
    securityStepsHidden: boolean; // dashboard UI
    dashboardGraphHidden: boolean; // dashboard UI
    dashboardAssetsGridMode: boolean; // dashboard UI
    showDashboardT3T1PromoBanner: boolean;
    showSettingsDesktopAppPromoBanner: boolean;
    stakeEthBannerClosed: boolean; // banner in account view (Overview tab) presenting ETH staking feature
    showDashboardStakingPromoBanner: boolean;
    isViewOnlyModeVisible: boolean;
    isDashboardPassphraseBannerVisible: boolean;
    viewOnlyPromoClosed: boolean;
    viewOnlyTooltipClosed: boolean;
}

export interface EvmSettings {
    confirmExplanationModalClosed: Partial<Record<Network['symbol'], Record<string, boolean>>>;
    explanationBannerClosed: Partial<Record<Network['symbol'], boolean>>;
}

export interface SuiteSettings {
    theme: {
        variant: Exclude<SuiteThemeVariant, 'system'> | 'debug';
    };
    language: Locale;
    torOnionLinks: boolean;
    isCoinjoinReceiveWarningHidden: boolean;
    isDesktopSuitePromoHidden: boolean;
    debug: DebugModeOptions;
    autodetect: AutodetectSettings;
    isDeviceAuthenticityCheckDisabled: boolean;
    addressDisplayType: AddressDisplayOptions;
    defaultWalletLoading: WalletType;
}

export interface SuiteState {
    online: boolean;
    torStatus: TorStatus;
    torBootstrap: TorBootstrap | null;
    lifecycle: SuiteLifecycle;
    transport?: Partial<TransportInfo>;
    locks: Lock[];
    flags: Flags;
    evmSettings: EvmSettings;
    settings: SuiteSettings;
}

const initialState: SuiteState = {
    online: true,
    torStatus: TorStatus.Disabled,
    torBootstrap: null,
    lifecycle: { status: 'initial' },
    locks: [],
    flags: {
        initialRun: true,
        // recoveryCompleted: false;
        // pinCompleted: false;
        // passphraseCompleted: false;
        discreetModeCompleted: false,
        taprootBannerClosed: false,
        firmwareTypeBannerClosed: false,
        securityStepsHidden: false,
        dashboardGraphHidden: false,
        dashboardAssetsGridMode: true,
        showDashboardT3T1PromoBanner: true,
        showSettingsDesktopAppPromoBanner: true,
        stakeEthBannerClosed: false,
        showDashboardStakingPromoBanner: true,
        isViewOnlyModeVisible: true,
        viewOnlyPromoClosed: false,
        viewOnlyTooltipClosed: false,
        isDashboardPassphraseBannerVisible: true,
    },
    evmSettings: {
        confirmExplanationModalClosed: {},
        explanationBannerClosed: {},
    },
    settings: {
        theme: {
            variant: 'light',
        },
        language: ensureLocale('en'),
        torOnionLinks: isWeb(),
        isCoinjoinReceiveWarningHidden: false,
        isDesktopSuitePromoHidden: false,
        isDeviceAuthenticityCheckDisabled: false,
        debug: {
            invityServerEnvironment: undefined,
            showDebugMenu: false,
            checkFirmwareAuthenticity: false,
            transports: [],
            isUnlockedBootloaderAllowed: false,
        },
        autodetect: {
            language: true,
            theme: true,
        },
        addressDisplayType: AddressDisplayOptions.CHUNKED,
        defaultWalletLoading: WalletType.STANDARD,
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
                draft.evmSettings = {
                    ...draft.evmSettings,
                    ...action.payload.suiteSettings?.evmSettings,
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

            case SUITE.SET_LANGUAGE:
                draft.settings.language = action.locale;
                break;

            case SUITE.SET_DEBUG_MODE:
                draft.settings.debug = { ...draft.settings.debug, ...action.payload };
                break;

            case SUITE.SET_FLAG:
                setFlag(draft, action.key, action.value);
                break;

            case SUITE.EVM_CONFIRM_EXPLANATION_MODAL:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    confirmExplanationModalClosed: {
                        ...draft.evmSettings.confirmExplanationModalClosed,
                        [action.symbol]: {
                            ...draft.evmSettings.confirmExplanationModalClosed[action.symbol],
                            [action.route]: true,
                        },
                    },
                };
                break;

            case SUITE.EVM_CLOSE_EXPLANATION_BANNER:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    explanationBannerClosed: {
                        ...draft.evmSettings.explanationBannerClosed,
                        [action.symbol]: true,
                    },
                };
                break;

            case SUITE.SET_THEME:
                draft.settings.theme.variant = action.variant;
                break;

            case SUITE.SET_ADDRESS_DISPLAY_TYPE:
                draft.settings.addressDisplayType = action.option;
                break;

            case SUITE.SET_DEFAULT_WALLET_LOADING:
                draft.settings.defaultWalletLoading = action.option;
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

            case SUITE.TOR_BOOTSTRAP:
                draft.torBootstrap = action.payload;
                break;

            case SUITE.ONION_LINKS:
                draft.settings.torOnionLinks = action.payload;
                break;

            case SUITE.COINJOIN_RECEIVE_WARNING:
                draft.settings.isCoinjoinReceiveWarningHidden = action.payload;
                break;
            case SUITE.DEVICE_AUTHENTICITY_OPT_OUT:
                draft.settings.isDeviceAuthenticityCheckDisabled = action.payload;
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

            case discoveryActions.startDiscovery.type:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, true);
                break;

            case discoveryActions.completeDiscovery.type:
            case discoveryActions.stopDiscovery.type:
                changeLock(draft, SUITE.LOCK_TYPE.DEVICE, false);
                break;

            // no default
        }
    });

export const selectTorState = (state: SuiteRootState) => {
    const { torStatus, torBootstrap } = state.suite;

    return {
        isTorEnabled: getIsTorEnabled(torStatus),
        isTorLoading: getIsTorLoading(torStatus),
        isTorError: torStatus === TorStatus.Error,
        isTorDisabling: torStatus === TorStatus.Disabling,
        isTorDisabled: torStatus === TorStatus.Disabled,
        isTorEnabling: torStatus === TorStatus.Enabling,
        torBootstrap,
    };
};

// TODO: use this selector in all places where we need to check if debug mode is active
export const selectIsDebugModeActive = (state: SuiteRootState) =>
    state.suite.settings.debug.showDebugMenu;

export const selectLanguage = (state: SuiteRootState) => state.suite.settings.language;

export const selectAddressDisplayType = (state: SuiteRootState) =>
    state.suite.settings.addressDisplayType;

export const selectLocks = (state: SuiteRootState) => state.suite.locks;

export const selectIsDeviceLocked = (state: SuiteRootState) =>
    state.suite.locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
    state.suite.locks.includes(SUITE.LOCK_TYPE.UI);

export const selectIsActionAbortable = (state: SuiteRootState) =>
    state.suite.transport?.type === 'BridgeTransport'
        ? versionUtils.isNewerOrEqual(state.suite.transport?.version as string, '2.0.31')
        : true; // WebUSB

export const selectPrerequisite = (state: SuiteRootState & RouterRootState & DeviceRootState) => {
    const { transport } = state.suite;
    const device = selectDevice(state);
    const router = selectRouter(state);

    const excluded = getExcludedPrerequisites(router);
    const prerequisite = getPrerequisiteName({ router, device, transport });

    if (prerequisite === undefined) return;

    if (excluded.includes(prerequisite)) {
        return;
    }

    return prerequisite;
};

export const selectIsDashboardT3T1PromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showDashboardT3T1PromoBanner;

export const selectIsSettingsDesktopAppPromoBannerShown = (state: SuiteRootState) =>
    state.suite.flags.showSettingsDesktopAppPromoBanner;

export const selectIsLoggedOut = (state: SuiteRootState & DeviceRootState) =>
    state.suite.flags.initialRun || state.device?.selectedDevice?.mode !== 'normal';

export const selectSuiteFlags = (state: SuiteRootState) => state.suite.flags;

export const selectSuiteSettings = (state: SuiteRootState) => ({
    defaultWalletLoading: state.suite.settings.defaultWalletLoading,
    isViewOnlyModeVisible: state.suite.flags.isViewOnlyModeVisible,
});

export default suiteReducer;
