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
    isDesktop,
} from '@trezor/env-utils';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { GetSystemInformationResponse } from '@trezor/suite-desktop-api/src/messages';
import {
    selectRememberedStandardWalletsCount,
    selectRememberedHiddenWalletsCount,
} from '@suite-common/wallet-core';

import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';
import { AppState } from 'src/types/suite';

import { getIsTorEnabled } from './tor';

const getOptionalSystemInformation = async (): Promise<GetSystemInformationResponse | null> => {
    if (!isDesktop()) return null;
    try {
        const response = await desktopApi.getSystemInformation();

        return response.success ? response.payload : null;
    } catch {
        return null;
    }
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

export const getSuiteReadyPayload = async (state: AppState) => {
    const systemInformation = await getOptionalSystemInformation();

    return {
        language: state.suite.settings.language,
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
        // todo: duplicated with suite/src/utils/suite/logUtils
        labeling: state.metadata.enabled
            ? state.metadata.providers.find(
                  p => p.clientId === state.metadata.selectedProvider.labels,
              )?.type || 'missing-provider'
            : '',
        rememberedStandardWallets: selectRememberedStandardWalletsCount(state),
        rememberedHiddenWallets: selectRememberedHiddenWalletsCount(state),
        theme: state.suite.settings.theme.variant,
        suiteVersion: process.env.VERSION || '',
        earlyAccessProgram: state.desktopUpdate.allowPrerelease,
        experimentalFeatures: state.suite.settings.experimental,
        browserName: getBrowserName(),
        browserVersion: getBrowserVersion(),
        osName: getOsName(),
        // version from UA parser, which includes only the most basic info as it runs in renderer process
        osVersion: getOsVersion(),
        // detailed info obtained in main process, if available
        desktopOsVersion: systemInformation?.osVersion,
        desktopOsName: systemInformation?.osName,
        desktopOsArchitecture: systemInformation?.osArchitecture,

        windowWidth: getWindowWidth(),
        windowHeight: getWindowHeight(),
        autodetectLanguage: state.suite.settings.autodetect.language,
        autodetectTheme: state.suite.settings.autodetect.theme,
    };
};

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
