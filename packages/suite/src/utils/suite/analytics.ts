import { AppState } from 'src/types/suite';
import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';

import { AppUpdateEvent } from '@trezor/suite-analytics';
import {
    getScreenWidth,
    getScreenHeight,
    getBrowserName,
    getBrowserVersion,
    getOsName,
    getOsVersion,
    getWindowWidth,
    getWindowHeight,
    getPlatformLanguages,
} from '@trezor/env-utils';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import type { UpdateInfo } from '@trezor/suite-desktop-api';

import { getIsTorEnabled } from './tor';

// redact transaction id from account transaction anchor
export const redactTransactionIdFromAnchor = (anchor?: string) => {
    if (!anchor) {
        return undefined;
    }

    return anchor.startsWith(AccountTransactionBaseAnchor) ? AccountTransactionBaseAnchor : anchor;
};

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
