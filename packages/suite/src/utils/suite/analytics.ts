import { AppUpdateEvent } from '@trezor/suite-analytics';

import { AppState } from '@suite-types';
import { getOsName } from '@suite-utils/env';
import {
    getScreenWidth,
    getScreenHeight,
    getBrowserName,
    getBrowserVersion,
    getOsVersion,
    getWindowWidth,
    getWindowHeight,
    getPlatformLanguages,
} from '@trezor/env-utils';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { AccountTransactionBaseAnchor } from '@suite-constants/anchors';
import { getIsTorEnabled } from './tor';
import { UNIT_ABBREVIATIONS } from '@wallet-hooks/useBitcoinAmountUnit';

import type { AnalyticsState } from '@suite-reducers/analyticsReducer';
import type { UpdateInfo } from '@trezor/suite-desktop-api';

// redact transaction id from account transaction anchor
export const redactTransactionIdFromAnchor = (anchor?: string) => {
    if (!anchor) {
        return undefined;
    }

    return anchor.startsWith(AccountTransactionBaseAnchor) ? AccountTransactionBaseAnchor : anchor;
};

// allow tracking only if user already confirmed data collection
export const hasUserAllowedTracking = (
    enabled: AnalyticsState['enabled'],
    confirmed: AnalyticsState['confirmed'],
) => !!confirmed && !!enabled;

export const getSuiteReadyPayload = (state: AppState) => ({
    language: state.suite.settings.language,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    customBackends: getCustomBackends(state.wallet.blockchain)
        .map(({ coin }) => coin)
        .filter(coin => state.wallet.settings.enabledNetworks.includes(coin)),
    localCurrency: state.wallet.settings.localCurrency,
    bitcoinUnit: UNIT_ABBREVIATIONS[state.wallet.settings.bitcoinAmountUnit],
    discreetMode: state.wallet.settings.discreetMode,
    screenWidth: getScreenWidth(),
    screenHeight: getScreenHeight(),
    platformLanguages: getPlatformLanguages().join(','),
    tor: getIsTorEnabled(state.suite.torStatus),
    labeling: state.metadata.enabled ? state.metadata.provider?.type || 'missing-provider' : '',
    rememberedStandardWallets: state.devices.filter(d => d.remember && d.useEmptyPassphrase).length,
    rememberedHiddenWallets: state.devices.filter(d => d.remember && !d.useEmptyPassphrase).length,
    theme: state.suite.settings.theme.variant,
    suiteVersion: process.env.VERSION || '',
    earlyAccessProgram: state.desktopUpdate.allowPrerelease,
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
    osName: getOsName(),
    osVersion: getOsVersion(),
    windowWidth: getWindowWidth(),
    windowHeight: getWindowHeight(),
    autodetectLanguage: state.suite.settings.autodetect.language,
    autodetectTheme: state.suite.settings.autodetect.theme,
});

export const getAppUpdatePayload = (
    status: AppUpdateEvent['status'],
    earlyAccessProgram: boolean,
    updateInfo?: UpdateInfo,
): AppUpdateEvent => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
});
