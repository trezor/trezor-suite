import { type PayloadAction } from '@reduxjs/toolkit';

import type { ExperimentalFeature } from '@suite/experimental';
import { type OAuthServerEnvironment } from '@suite-common/metadata-types';
import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { type Locale } from '@suite-common/suite-types';
import type { InvityServerEnvironment } from '@suite-common/trading';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { type ConnectSettings } from '@trezor/connect';
import { isWeb } from '@trezor/env-utils';
import { type SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { SIDEBAR_WIDTH_NUMERIC } from './suiteConstants';

export interface DebugModeOptions {
    invityServerEnvironment?: InvityServerEnvironment;
    oauthServerEnvironment?: OAuthServerEnvironment;
    showDebugMenu: boolean;
    transports: Extract<NonNullable<ConnectSettings['transports']>[number], string>[];
    isUnlockedBootloaderAllowed: boolean;
    showConnectLogs: boolean;
    isN4w1BackupEnabled: boolean;
}

export interface AutodetectSettings {
    language: boolean;
    theme: boolean;
}

export interface SuiteSettingsState {
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

export type SuiteSettingsRootState = {
    suiteSettings: SuiteSettingsState;
};

export const suiteSettingsInitialState: SuiteSettingsState = {
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
        isN4w1BackupEnabled: false,
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
};

const suiteSettingsSlice = createSliceWithExtraDeps({
    name: 'suiteSettings',
    initialState: suiteSettingsInitialState,
    reducers: {
        setLanguage: (state, { payload }: PayloadAction<Locale>) => {
            state.language = payload;
        },
        setDebugMode: (state, { payload }: PayloadAction<Partial<DebugModeOptions>>) => {
            state.debug = { ...state.debug, ...payload };
        },
        setExperimentalFeatures: (
            state,
            { payload }: PayloadAction<ExperimentalFeature[] | undefined>,
        ) => {
            state.experimental = payload;
        },
        setTheme: (state, { payload }: PayloadAction<SuiteSettingsState['theme']['variant']>) => {
            state.theme.variant = payload;
        },
        setAddressDisplayType: (
            state,
            { payload }: PayloadAction<SuiteSettingsState['addressDisplayType']>,
        ) => {
            state.addressDisplayType = payload;
        },
        setAutodetect: (state, { payload }: PayloadAction<Partial<AutodetectSettings>>) => {
            state.autodetect = { ...state.autodetect, ...payload };
        },
        setSidebarWidth: (state, { payload }: PayloadAction<number>) => {
            state.sidebarWidth = payload;
        },
        setIsCoinsFilterVisible: (state, { payload }: PayloadAction<boolean>) => {
            state.isCoinsFilterVisible = payload;
        },
        setOnionLinks: (state, { payload }: PayloadAction<boolean>) => {
            state.torOnionLinks = payload;
        },
        setCoinjoinReceiveWarningHidden: (state, { payload }: PayloadAction<boolean>) => {
            state.isCoinjoinReceiveWarningHidden = payload;
        },
        toggleDeviceAuthenticityCheck: (state, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.deviceAuthenticity = payload;
        },
        toggleFirmwareRevisionCheck: (state, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.firmwareRevision = payload;
        },
        toggleFirmwareHashCheck: (state, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.firmwareHash = payload;
        },
        toggleEntropyCheck: (state, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.entropy = payload;
        },
        toggleDeviceMetaChecks: (state, { payload }: PayloadAction<boolean>) => {
            state.enabledSecurityChecks.deviceMeta = payload;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadSuiteSettings);
    },
});

export const suiteSettingsActions = suiteSettingsSlice.actions;
export const prepareSuiteSettingsReducer = suiteSettingsSlice.prepareReducer;
