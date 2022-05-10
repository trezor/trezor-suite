import { AppUpdateEvent } from '@trezor/suite-analytics';

import { AppState } from '@suite-types';
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
} from '@suite-utils/env';
import { getCustomBackends } from '@suite-utils/backend';

import type { UpdateInfo } from '@trezor/suite-desktop-api';

export const getSuiteReadyPayload = (state: AppState) => ({
    language: state.suite.settings.language,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    customBackends: getCustomBackends(state.wallet.blockchain).map(({ coin }) => coin),
    localCurrency: state.wallet.settings.localCurrency,
    discreetMode: state.wallet.settings.discreetMode,
    screenWidth: getScreenWidth(),
    screenHeight: getScreenHeight(),
    platformLanguages: getPlatformLanguages().join(','),
    tor: state.suite.tor,
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
