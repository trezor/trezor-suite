import { Account, Discovery } from '@wallet-types';
import { ACCOUNT, DISCOVERY } from '@wallet-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { DEVICE, Device } from '@trezor/connect';
import { LogEntry } from '@suite-reducers/logsReducer';
import { AppState } from '@suite-types';
import { getCustomBackends } from '@suite-common/wallet-utils';
import {
    getBrowserName,
    getBrowserVersion,
    getEnvironment,
    getOsName,
    getOsVersion,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getWindowHeight,
    getWindowWidth,
} from '@suite-utils/env';
import { getIsTorEnabled } from '@suite-utils/tor';
import { DeepPartial } from '@trezor/type-utils';

export const REDACTED_REPLACEMENT = '[redacted]';

export const prettifyLog = (json: Record<any, any>) => JSON.stringify(json, null, 2);

export const redactAccount = (account: DeepPartial<Account> | undefined) => {
    if (!account) return undefined;
    return {
        ...account,
        descriptor: REDACTED_REPLACEMENT,
        deviceState: REDACTED_REPLACEMENT,
        addresses: REDACTED_REPLACEMENT,
        balance: REDACTED_REPLACEMENT,
        availableBalance: REDACTED_REPLACEMENT,
        formattedBalance: REDACTED_REPLACEMENT,
        history: REDACTED_REPLACEMENT,
        tokens: account?.tokens?.map(t => ({
            ...t,
            balance: REDACTED_REPLACEMENT,
        })),
        utxo: REDACTED_REPLACEMENT,
        metadata: REDACTED_REPLACEMENT,
        key: REDACTED_REPLACEMENT,
        misc: account.misc
            ? {
                  ...account.misc,
                  staking:
                      'staking' in account.misc
                          ? {
                                ...account.misc.staking,
                                address: REDACTED_REPLACEMENT,
                                rewards: REDACTED_REPLACEMENT,
                                poolId: account.misc.staking?.poolId ? REDACTED_REPLACEMENT : null,
                            }
                          : undefined,
              }
            : undefined,
    };
};

export const redactDiscovery = (discovery: DeepPartial<Discovery> | undefined) => {
    if (!discovery) return undefined;

    return {
        ...discovery,
        deviceState: REDACTED_REPLACEMENT,
    };
};

export const redactDevice = (device: DeepPartial<Device> | undefined) => {
    if (!device) return undefined;
    return {
        ...device,
        id: REDACTED_REPLACEMENT,
        label: device.label ? REDACTED_REPLACEMENT : undefined,
        state: REDACTED_REPLACEMENT,
        firmwareRelease: REDACTED_REPLACEMENT,
        features: device.features
            ? {
                  ...device.features,
                  device_id: REDACTED_REPLACEMENT,
                  label: device.features.label ? REDACTED_REPLACEMENT : undefined,
              }
            : undefined,
    };
};

export const redactAction = (action: LogEntry) => {
    let payload;
    switch (action.type) {
        case SUITE.AUTH_DEVICE:
            payload = {
                state: REDACTED_REPLACEMENT,
                ...redactDevice(action.payload),
            };
            break;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            payload = {
                ...action.payload,
                account: redactAccount(action.payload?.account),
                network: undefined,
                discovery: undefined,
            };
            break;
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
        case SUITE.UPDATE_SELECTED_DEVICE:
        case SUITE.REMEMBER_DEVICE:
            payload = redactDevice(action.payload);
            break;

        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE:
            payload = redactAccount(action.payload);
            break;

        case DISCOVERY.COMPLETE:
            payload = redactDiscovery(action.payload);
            break;
        default:
            return action;
    }
    return {
        ...action,
        payload,
    };
};

export const getApplicationLog = (log: LogEntry[], redactSensitiveData = false) =>
    log.map(entry => {
        const metadata = {
            type: entry.type,
            datetime: entry.datetime,
        };

        let redactedAction = entry.payload;
        if (redactSensitiveData) {
            redactedAction = redactAction(entry);
        }

        if (typeof redactedAction?.payload === 'object') {
            return { ...metadata, payload: { ...redactedAction.payload } };
        }

        return {
            ...metadata,
            payload: {
                ...redactedAction,
            },
        };
    });

export const getApplicationInfo = (state: AppState) => ({
    environment: getEnvironment(),
    suiteVersion: process.env.VERSION || '',
    commitHash: process.env.COMMITHASH || '',
    isDev: !process.env.CODESIGN_BUILD,
    debugMenu: state.suite.settings.debug.showDebugMenu,
    online: state.suite.online,
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
    osName: getOsName(),
    osVersion: getOsVersion(),
    windowWidth: getWindowWidth(),
    windowHeight: getWindowHeight(),
    screenWidth: getScreenWidth(),
    screenHeight: getScreenHeight(),
    earlyAccessProgram: state.desktopUpdate.allowPrerelease,
    language: state.suite.settings.language,
    autodetectLanguage: state.suite.settings.autodetect.language,
    platformLanguages: getPlatformLanguages().join(','),
    theme: state.suite.settings.theme.variant,
    autodetectTheme: state.suite.settings.autodetect.theme,
    localCurrency: state.wallet.settings.localCurrency,
    discreetMode: state.wallet.settings.discreetMode,
    tor: getIsTorEnabled(state.suite.torStatus),
    torOnionLinks: state.suite.settings.torOnionLinks,
    labeling: state.metadata.enabled ? state.metadata.provider?.type || 'missing-provider' : '',
    analytics: state.analytics.enabled,
    transport: state.suite.transport?.type,
    transportVersion: state.suite.transport?.version,
    wallets: state.devices.length,
    devices: [...new Set(state.devices.map(device => device.id))].length,
    rememberedStandardWallets: state.devices.filter(d => d.remember && d.useEmptyPassphrase).length,
    rememberedHiddenWallets: state.devices.filter(d => d.remember && !d.useEmptyPassphrase).length,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    customBackends: getCustomBackends(state.wallet.blockchain).map(({ coin }) => coin),
});
