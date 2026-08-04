import { type PayloadAction } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';
import { type EarnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-defs';
import { type OAuthServerEnvironment } from '@suite-common/metadata-types';
import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { type Locale } from '@suite-common/suite-types';
import type { TradeServerEnvironment } from '@suite-common/trading';
import type { DefinitionsChannel } from '@trezor/connect-common';
import { isWeb } from '@trezor/env-utils';
import { type SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { SIDEBAR_WIDTH_NUMERIC } from './suiteConstants';

/**
 * String identifiers used by the debug transport switcher UI.
 */
export type DebugTransport =
    | 'BridgeTransport'
    | 'NodeUsbTransport'
    | 'UdpTransport'
    | 'WebUsbTransport';

export interface DebugModeOptions {
    tradeServerEnvironment?: TradeServerEnvironment;
    earnYieldWorkerBaseUrl?: EarnYieldWorkerBaseUrl;
    oauthServerEnvironment?: OAuthServerEnvironment;
    transports: DebugTransport[];
    isUnlockedBootloaderAllowed: boolean;
    showConnectLogs: boolean;
    definitionsChannel?: DefinitionsChannel;
    isN4w1BackupEnabled: boolean;
    showTranslationKeys: boolean;
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

export interface SuiteSettingsState {
    theme: {
        variant: Exclude<SuiteThemeVariant, 'system'>;
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
    experimental?: ExperimentalFeature[];
    isTestnetNetworksEnabled: boolean;
    isNftSectionEnabled: boolean;
    sidebarWidth: number;
    isCoinsFilterVisible: boolean;
    suiteSyncRelayUrl: string | null;
    autoEject: boolean;
}

export type SuiteSettingsRootState = {
    suiteSettings: SuiteSettingsState;
};

export const suiteSettingsInitialState: SuiteSettingsState = {
    theme: {
        variant: 'dark', // Suite Dark flavour: dark by default (user can still switch)
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
        tradeServerEnvironment: undefined,
        earnYieldWorkerBaseUrl: undefined,
        transports: [],
        isUnlockedBootloaderAllowed: false,
        showConnectLogs: false,
        isN4w1BackupEnabled: false,
        showTranslationKeys: false,
    },
    autodetect: {
        language: true,
        theme: false, // Suite Dark flavour: default to the dark theme, not the OS setting
    },
    isTestnetNetworksEnabled: false,
    isNftSectionEnabled: false,
    sidebarWidth: SIDEBAR_WIDTH_NUMERIC,
    isCoinsFilterVisible: false,
    suiteSyncRelayUrl: null,
    autoEject: false,
};

const suiteSettingsSlice = createSliceWithExtraDeps({
    name: 'suiteSettings',
    initialState: suiteSettingsInitialState,
    reducers: {
        setLanguage: (state: SuiteSettingsState, { payload }: PayloadAction<Locale>) => {
            state.language = payload;
        },
        setDebugMode: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<Partial<DebugModeOptions>>,
        ) => {
            state.debug = { ...state.debug, ...payload };
        },
        setExperimentalFeatures: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<ExperimentalFeature[] | undefined>,
        ) => {
            state.experimental = payload;
        },
        setIsTestnetNetworksEnabled: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.isTestnetNetworksEnabled = payload;
        },
        setIsNftSectionEnabled: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.isNftSectionEnabled = payload;
        },
        setTheme: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<SuiteSettingsState['theme']['variant']>,
        ) => {
            state.theme.variant = payload;
        },
        setAutodetect: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<Partial<AutodetectSettings>>,
        ) => {
            state.autodetect = { ...state.autodetect, ...payload };
        },
        setSidebarWidth: (state: SuiteSettingsState, { payload }: PayloadAction<number>) => {
            state.sidebarWidth = payload;
        },
        setIsCoinsFilterVisible: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.isCoinsFilterVisible = payload;
        },
        setOnionLinks: (state: SuiteSettingsState, { payload }: PayloadAction<boolean>) => {
            state.torOnionLinks = payload;
        },
        setCoinjoinReceiveWarningHidden: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.isCoinjoinReceiveWarningHidden = payload;
        },
        toggleDeviceAuthenticityCheck: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.enabledSecurityChecks.deviceAuthenticity = payload;
        },
        toggleFirmwareRevisionCheck: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.enabledSecurityChecks.firmwareRevision = payload;
        },
        toggleFirmwareHashCheck: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.enabledSecurityChecks.firmwareHash = payload;
        },
        toggleEntropyCheck: (state: SuiteSettingsState, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.entropy = payload;
        },
        toggleDeviceMetaChecks: (
            state: SuiteSettingsState,
            { payload }: PayloadAction<boolean>,
        ) => {
            state.enabledSecurityChecks.deviceMeta = payload;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadSuiteSettings);
    },
});

export const suiteSettingsActions = suiteSettingsSlice.actions;
export const prepareSuiteSettingsReducer = suiteSettingsSlice.prepareReducer;
