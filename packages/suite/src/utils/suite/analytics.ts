import type { SuiteReadyPayload } from '@suite/analytics';
import { type DesktopUpdateRootState } from '@suite/desktop-update';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
} from '@suite/metadata';
import { AccountTransactionBaseAnchor, EarnAnchor, isEarnYieldRowAnchor } from '@suite/router';
import {
    selectAutodetectLanguage,
    selectAutodetectTheme,
    selectExperimentalFeatures,
    selectLanguage,
    selectTheme,
} from '@suite/settings';
import { type DesktopSuiteSyncRootState } from '@suite/suite-sync';
import { type TorRootState, selectIsTorEnabled } from '@suite/tor';
import { type AnalyticsRootState } from '@suite-common/analytics-redux';
import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { type DiscreetModeRootState } from '@suite-common/discreet-mode';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import {
    getBrowserName,
    getBrowserVersion,
    getCpuArch,
    getOsVersion,
} from '@suite-common/suite-utils';
import { type BlockchainRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { getCustomBackends } from '@suite-common/wallet-utils';
import {
    getOsName,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getWindowHeight,
    getWindowWidth,
} from '@trezor/env-utils';

export type GetSuiteReadyPayloadState = AnalyticsRootState &
    BlockchainRootState &
    DesktopUpdateRootState &
    DesktopSuiteSyncRootState &
    DiscreetModeRootState &
    LegacyLabelingVisibleRootState &
    TorRootState &
    WalletSettingsRootState;

const resolveLabelingType = (
    state: GetSuiteReadyPayloadState,
): MetadataProviderType | 'missing-provider' | 'suite-sync' | 'off' => {
    if (selectIsLegacyLabelingVisible(state)) {
        return (
            state.metadata.providers.find(
                p => p.clientId === state.metadata.selectedProvider.labels,
            )?.type || 'missing-provider'
        );
    }

    return state.suiteSync.settings.isSuiteSyncEnabled ? 'suite-sync' : 'off';
};

// Collapses the per-item part of anchors (transaction id, earn yield row) — anchors reach
// analytics and logs, so they must never carry account-identifying data.
export const redactAnchor = (anchor?: string) => {
    if (!anchor) {
        return undefined;
    }

    if (anchor.startsWith(AccountTransactionBaseAnchor)) {
        return AccountTransactionBaseAnchor;
    }

    if (isEarnYieldRowAnchor(anchor)) {
        return EarnAnchor.Yield;
    }

    return anchor;
};

// 1. replace coinjoin by taproot
export const redactRouterUrl = (url: string) => url.replace(/coinjoin/g, 'taproot');

export const getSuiteReadyPayload = async (
    state: GetSuiteReadyPayloadState,
): Promise<SuiteReadyPayload> => {
    const experimentVariants = selectActiveExperimentsWithVariants(state);
    const [osVersion, osCpuArch] = await Promise.all([getOsVersion(), getCpuArch()]);

    return {
        language: selectLanguage(state),
        enabledNetworks: state.wallet.settings.enabledNetworks,
        customBackends: getCustomBackends(state.wallet.blockchain)
            .map(({ symbol }) => symbol)
            .filter(symbol => state.wallet.settings.enabledNetworks.includes(symbol)),
        localCurrency: state.wallet.settings.localCurrency,
        bitcoinUnit: UNIT_ABBREVIATIONS[state.wallet.settings.bitcoinAmountUnit],
        discreetMode: state.discreetMode.isActive,
        screenWidth: getScreenWidth(),
        screenHeight: getScreenHeight(),
        platformLanguages: getPlatformLanguages().join(','),
        tor: selectIsTorEnabled(state),
        labeling: resolveLabelingType(state),
        rememberedStandardWallets: selectRememberedStandardWalletsCount(state),
        rememberedHiddenWallets: selectRememberedHiddenWalletsCount(state),
        theme: selectTheme(state),
        suiteVersion: process.env.VERSION || '',
        earlyAccessProgram: state.desktopUpdate.allowPrerelease,
        experimentalFeatures: selectExperimentalFeatures(state),
        browserName: getBrowserName(),
        browserVersion: getBrowserVersion(),
        osName: getOsName(),
        osVersion,
        osCpuArch,

        windowWidth: getWindowWidth(),
        windowHeight: getWindowHeight(),
        autodetectLanguage: selectAutodetectLanguage(state),
        autodetectTheme: selectAutodetectTheme(state),

        isAutomaticUpdateEnabled: state.desktopUpdate.isAutomaticUpdateEnabled,

        experimentVariants: formatExperimentVariantsForAnalytics(experimentVariants),

        mevProtection: state.wallet.settings.mevProtection,
        networkReserve: state.wallet.settings.networkReserve,
    };
};
