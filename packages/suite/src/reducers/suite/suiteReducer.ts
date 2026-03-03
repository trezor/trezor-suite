import { produce } from 'immer';

import type { ExperimentalFeature } from '@suite/experimental';
import type { CountryCode } from '@suite-common/geolocation';
import { OAuthServerEnvironment } from '@suite-common/metadata-types';
import { Locale } from '@suite-common/suite-types';
import type { InvityServerEnvironment } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { ConnectSettings, TRANSPORT, TransportInfo } from '@trezor/connect';
import { isWeb } from '@trezor/env-utils';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { STORAGE, SUITE } from 'src/actions/suite/constants';
import { LOCK_TYPE } from 'src/actions/suite/constants/suiteConstants';
import { SIDEBAR_WIDTH_NUMERIC } from 'src/constants/suite/layout';
import { Action, TorBootstrap, TorStatus } from 'src/types/suite';

export interface SuiteRootState {
    suite: SuiteState;
}

export interface DebugModeOptions {
    invityServerEnvironment?: InvityServerEnvironment;
    oauthServerEnvironment?: OAuthServerEnvironment;
    showDebugMenu: boolean;
    transports: Extract<NonNullable<ConnectSettings['transports']>[number], string>[];
    isUnlockedBootloaderAllowed: boolean;
    showConnectLogs: boolean;
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

type SuiteLifecycle =
    | { status: 'initial' }
    | { status: 'loading' }
    | { status: 'ready' }
    // errors set from connect, should be renamed
    | { status: 'error'; error: string }
    // blocked if the instance cannot upgrade due to older version running,
    // blocking in case instance is running older version thus blocking other instance
    | { status: 'db-error'; error: 'blocking' | 'blocked' }
    // inconsistent IDB state detected, need to reset storage
    | { status: 'db-corrupted'; error: unknown };

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
    showTEXDashboardPromoBanner: boolean;
    showTS7DashboardPromoBanner: boolean;
    showSettingsDesktopAppPromoBanner: boolean;
    stakeEthBannerClosed: boolean; // banner in account view (Overview tab) presenting ETH staking feature
    stakeSolBannerClosed: boolean; // banner in account view (Overview tab) presenting SOL staking feature
    stakeCardanoBannerClosed: boolean; // banner in account view (Overview tab) presenting Cardano staking feature
    showDashboardStakingPromoBanner: boolean;
    suspiciousTransactionsTooltipClosed: boolean;
    showUnhideTokenModal: boolean;
    showCopyAddressModal: boolean;
    enableAutoupdateOnNextRun: boolean;
    showBluetoothDebugInfo: boolean;
    stellarLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Stellar
    solanaLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Solana
    hasSeenDisconnectTooltip: boolean; // tooltip shown when device disconnects - show only once ever
}

export interface EvmSettings {
    confirmExplanationModalClosed: Partial<Record<NetworkSymbol, Record<string, boolean>>>;
    explanationBannerClosed: Partial<Record<NetworkSymbol, boolean>>;
}

export interface PrefillFields {
    sendForm?: string;
    transactionHistory?: string;
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
    enabledSecurityChecks: {
        deviceAuthenticity: boolean;
        entropy: boolean;
        firmwareRevision: boolean;
        firmwareHash: boolean;
        deviceMeta: boolean;
    };
    addressDisplayType: AddressDisplayOptions;
    experimental?: ExperimentalFeature[];
    sidebarWidth: number;
    isCoinsFilterVisible: boolean;
    suiteSyncRelayUrl: string | null;
    autoEject: boolean;
}

export interface TransportState {
    transports: TransportInfo[];
    error?: string;
}

export interface SuiteState {
    online: boolean;
    torStatus: TorStatus;
    torBootstrap: TorBootstrap | null;
    lifecycle: SuiteLifecycle;
    transport?: TransportState;
    locks: Record<(typeof SUITE.LOCK_TYPE)[keyof typeof SUITE.LOCK_TYPE], number>;
    flags: Flags;
    evmSettings: EvmSettings;
    countryCode: CountryCode | null;
    prefillFields: PrefillFields;
    settings: SuiteSettings;
    recentlyConnectedDeviceRef: string | null; // TODO use type DeviceRef from suite-types; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
    recentlyDisconnectedDevice: string | null;
    seenDisconnectNotificationForDeviceIds: string[];
}

const initialState: SuiteState = {
    online: true,
    torStatus: TorStatus.Disabled,
    torBootstrap: null,
    lifecycle: { status: 'initial' },
    locks: {
        [LOCK_TYPE.UI]: 0,
        [LOCK_TYPE.ROUTER]: 0,
        [LOCK_TYPE.DEVICE]: 0,
    },
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
        showTEXDashboardPromoBanner: true,
        showTS7DashboardPromoBanner: true,
        showSettingsDesktopAppPromoBanner: true,
        stakeEthBannerClosed: false,
        stakeSolBannerClosed: false,
        stakeCardanoBannerClosed: false,
        showDashboardStakingPromoBanner: true,
        suspiciousTransactionsTooltipClosed: false,
        showCopyAddressModal: true,
        showUnhideTokenModal: true,
        enableAutoupdateOnNextRun: false,
        showBluetoothDebugInfo: false,
        stellarLimitedHistoryBannerClosed: false,
        solanaLimitedHistoryBannerClosed: false,
        hasSeenDisconnectTooltip: false,
    },
    evmSettings: {
        confirmExplanationModalClosed: {},
        explanationBannerClosed: {},
    },
    prefillFields: {
        sendForm: '',
        transactionHistory: '',
    },
    countryCode: null,
    settings: {
        theme: {
            variant: 'light',
        },
        language: 'en-US',
        torOnionLinks: isWeb(),
        isCoinjoinReceiveWarningHidden: false,
        isDesktopSuitePromoHidden: false,
        enabledSecurityChecks: {
            deviceAuthenticity: true,
            entropy: true,
            firmwareRevision: true,
            firmwareHash: true,
            deviceMeta: true,
        },
        debug: {
            invityServerEnvironment: undefined,
            showDebugMenu: false,
            transports: [],
            isUnlockedBootloaderAllowed: false,
            showConnectLogs: false,
        },
        autodetect: {
            language: true,
            theme: true,
        },
        addressDisplayType: AddressDisplayOptions.CHUNKED,
        sidebarWidth: SIDEBAR_WIDTH_NUMERIC,
        isCoinsFilterVisible: false,
        suiteSyncRelayUrl: null,
        autoEject: false,
    },
    recentlyConnectedDeviceRef: null,
    recentlyDisconnectedDevice: null,
    seenDisconnectNotificationForDeviceIds: [],
};

export const suiteInitialState = initialState;

const changeLock = (
    draft: SuiteState,
    lock: (typeof SUITE.LOCK_TYPE)[keyof typeof SUITE.LOCK_TYPE],
    enabled: boolean,
) => {
    draft.locks[lock] = Math.max(draft.locks[lock] + (enabled ? 1 : -1), 0);
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
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    ...(action.payload.suiteSettings?.seenDisconnectNotificationForDeviceIds ?? []),
                ];
                draft.settings = {
                    ...draft.settings,
                    ...action.payload.suiteSettings?.settings,
                    enabledSecurityChecks: {
                        ...draft.settings.enabledSecurityChecks,
                        ...action.payload.suiteSettings?.settings.enabledSecurityChecks,
                    },
                };
                break;
            case STORAGE.ERROR:
                draft.lifecycle = { status: 'db-error', error: action.payload };
                break;
            case STORAGE.CORRUPTED:
                draft.lifecycle = { status: 'db-corrupted', error: action.payload };
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

            case SUITE.SET_EXPERIMENTAL_FEATURES:
                draft.settings.experimental = action.payload.enabledFeatures;
                break;

            case SUITE.SET_FLAG:
                setFlag(draft, action.key, action.value);
                break;

            case SUITE.SET_RECENTLY_CONNECTED_DEVICE:
                draft.recentlyConnectedDeviceRef = action.payload;
                break;
            case SUITE.SET_RECENTLY_DISCONNECTED_DEVICE:
                draft.recentlyDisconnectedDevice = action.payload;
                break;
            case SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION:
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    action.payload.deviceId,
                ];
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

            case SUITE.SET_SEND_FORM_PREFILL:
                draft.prefillFields.sendForm = action.payload.contractAddress;
                break;

            case SUITE.SET_TRANSACTION_HISTORY_PREFILL:
                draft.prefillFields.transactionHistory = action.payload;
                break;

            case SUITE.SET_ADDRESS_DISPLAY_TYPE:
                draft.settings.addressDisplayType = action.option;
                break;

            case SUITE.SET_AUTODETECT:
                draft.settings.autodetect = {
                    ...draft.settings.autodetect,
                    ...action.payload,
                };
                break;

            case SUITE.SET_SIDEBAR_WIDTH:
                draft.settings.sidebarWidth = action.payload.width;
                break;

            case SUITE.SET_IS_COINS_FILTER_VISIBLE:
                draft.settings.isCoinsFilterVisible = action.payload.isCoinsFilterVisible;
                break;

            case TRANSPORT.START: {
                const { ...transport } = action.payload;
                const transports = draft.transport?.transports ?? [];
                const index = transports.findIndex(t => t.apiType === transport.apiType);
                if (index >= 0) transports[index] = transport;
                else transports.push(transport);
                draft.transport = { transports };
                break;
            }
            case TRANSPORT.ERROR: {
                const { apiType, error } = action.payload;
                const transports =
                    !draft.transport || !apiType
                        ? (draft.transport?.transports ?? [])
                        : draft.transport.transports?.filter(t => t.apiType !== apiType);
                draft.transport = { transports, error };
                break;
            }
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
            case SUITE.TOGGLE_DEVICE_AUTHENTICITY_CHECK:
                draft.settings.enabledSecurityChecks.deviceAuthenticity = action.payload;
                break;
            case SUITE.TOGGLE_FIRMWARE_REVISION_CHECK:
                draft.settings.enabledSecurityChecks.firmwareRevision = action.payload;
                break;
            case SUITE.TOGGLE_DEVICE_META_CHECKS:
                draft.settings.enabledSecurityChecks.deviceMeta = action.payload;
                break;
            case SUITE.TOGGLE_FIRMWARE_HASH_CHECK:
                draft.settings.enabledSecurityChecks.firmwareHash = action.payload;
                break;
            case SUITE.TOGGLE_ENTROPY_CHECK:
                draft.settings.enabledSecurityChecks.entropy = action.payload;
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

            // no default
        }
    });

export default suiteReducer;
