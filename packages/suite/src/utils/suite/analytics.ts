import type { AppUpdateEvent, SuiteReadyPayload } from '@suite/analytics';
import { AccountTransactionBaseAnchor } from '@suite/router';
import {
    selectAutodetectLanguage,
    selectAutodetectTheme,
    selectExperimentalFeatures,
    selectLanguage,
    selectTheme,
} from '@suite/settings';
import {
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
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
import { getCustomBackends } from '@suite-common/wallet-utils';
import {
    getOsName,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getWindowHeight,
    getWindowWidth,
} from '@trezor/env-utils';
import { type UpdateInfo } from '@trezor/suite-desktop-api';

import { type AppState } from 'src/types/suite';

import { getIsTorEnabled } from './tor';

const resolveLabelingType = (
    state: AppState,
): MetadataProviderType | 'missing-provider' | 'suite-sync' | 'off' => {
    if (state.metadata.enabled) {
        return (
            state.metadata.providers.find(
                p => p.clientId === state.metadata.selectedProvider.labels,
            )?.type || 'missing-provider'
        );
    }

    return state.suiteSync.settings.isSuiteSyncEnabled ? 'suite-sync' : 'off';
};

// redact transaction id from account transaction anchor
export const redactTransactionIdFromAnchor = (anchor?: string) => {
    if (!anchor) {
        return undefined;
    }

    return anchor.startsWith(AccountTransactionBaseAnchor) ? AccountTransactionBaseAnchor : anchor;
};

// 1. replace coinjoin by taproot
export const redactRouterUrl = (url: string) => url.replace(/coinjoin/g, 'taproot');

export const getSuiteReadyPayload = async (state: AppState): Promise<SuiteReadyPayload> => {
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
        discreetMode: state.wallet.settings.discreetMode,
        screenWidth: getScreenWidth(),
        screenHeight: getScreenHeight(),
        platformLanguages: getPlatformLanguages().join(','),
        tor: getIsTorEnabled(state.suite.torStatus),
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

export const getAppUpdatePayload = ({
    status,
    earlyAccessProgram,
    updateInfo,
    isAutoUpdated,
}: {
    status: AppUpdateEvent['status'];
    earlyAccessProgram: boolean;
    updateInfo?: UpdateInfo;
    isAutoUpdated?: boolean;
}): AppUpdateEvent => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
    isAutoUpdated,
});
