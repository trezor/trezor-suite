import { AppState } from '@suite-types';
import * as analyticsActions from '@suite-actions/analyticsActions';
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
import type { AnalyticsEvent } from '@suite-actions/analyticsActions';

type Common = Pick<AppState['analytics'], 'instanceId' | 'sessionId'> & { version: string };

/**
encodeDataToQueryString method encodes analytics data to querystring in expected format
common properties are prefixed with "c" as common to avoid identifiers collisions
*/
export const encodeDataToQueryString = (event: AnalyticsEvent, common: Common) => {
    const { type } = event;
    const { version, sessionId, instanceId } = common;
    const params = new URLSearchParams({
        // eslint-disable @typescript-eslint/naming-convention
        c_v: version,
        c_type: type || '',
        c_commit: process.env.COMMITHASH || '',
        c_instance_id: instanceId || '',
        c_session_id: sessionId || '',
        c_timestamp: Date.now().toString(),
        // eslint-enable @typescript-eslint/naming-convention
    });

    if ('payload' in event) {
        Object.entries(event.payload).forEach(([key, value]) =>
            params.append(key, value?.toString() ?? ''),
        );
    }

    return params.toString();
};

// TODO(analytics-package): union a way how to define analytics actions
export const reportSuiteReadyAction = (state: AppState) =>
    analyticsActions.report({
        type: 'suite-ready',
        payload: {
            language: state.suite.settings.language,
            enabledNetworks: state.wallet.settings.enabledNetworks,
            customBackends: getCustomBackends(state.wallet.blockchain).map(({ coin }) => coin),
            localCurrency: state.wallet.settings.localCurrency,
            discreetMode: state.wallet.settings.discreetMode,
            screenWidth: getScreenWidth(),
            screenHeight: getScreenHeight(),
            platformLanguages: getPlatformLanguages().join(','),
            tor: state.suite.tor,
            rememberedStandardWallets: state.devices.filter(d => d.remember && d.useEmptyPassphrase)
                .length,
            rememberedHiddenWallets: state.devices.filter(d => d.remember && !d.useEmptyPassphrase)
                .length,
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
        },
    });

export enum AppUpdateEventStatus {
    Downloaded = 'downloaded',
    Closed = 'closed',
    Error = 'error',
}

// TODO(analytics-package): types file
export type AppUpdateEvent = {
    fromVersion?: string;
    toVersion?: string;
    status: AppUpdateEventStatus;
    earlyAccessProgram: boolean;
    isPrerelease?: boolean;
};

export const getAppUpdatePayload = (
    status: AppUpdateEventStatus,
    earlyAccessProgram: boolean,
    updateInfo?: UpdateInfo,
): AppUpdateEvent => ({
    fromVersion: process.env.VERSION || '',
    toVersion: updateInfo?.version,
    status,
    earlyAccessProgram,
    isPrerelease: updateInfo?.prerelease,
});
