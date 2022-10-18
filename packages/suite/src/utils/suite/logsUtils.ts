import { Account, Discovery } from '@wallet-types';
import { DISCOVERY } from '@wallet-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { DEVICE } from '@trezor/connect';
import { LogEntry } from '@suite-reducers/logsReducer';
import { AppState, TrezorDevice } from '@suite-types';
import { getCustomBackends } from '@suite-common/wallet-utils';
import { getEnvironment } from '@suite-utils/env';
import {
    getBrowserName,
    getBrowserVersion,
    getOsName,
    getOsVersion,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getWindowHeight,
    getWindowWidth,
} from '@trezor/env-utils';
import { getIsTorEnabled } from '@suite-utils/tor';
import { DeepPartial } from '@trezor/type-utils';
import { accountsActions } from '@suite-common/wallet-core';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getDeviceModel,
    getFwRevision,
    getFwType,
    getFwVersion,
    getPhysicalDeviceUniqueIds,
} from './device';

export const REDACTED_REPLACEMENT = '[redacted]';

export const startTime = new Date().toUTCString();

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

export const redactDevice = (device: DeepPartial<TrezorDevice> | undefined) => {
    if (!device) return undefined;
    return {
        ...device,
        id: REDACTED_REPLACEMENT,
        label: device.label ? REDACTED_REPLACEMENT : undefined,
        state: REDACTED_REPLACEMENT,
        firmwareRelease: device.firmwareRelease ? REDACTED_REPLACEMENT : undefined,
        features: device.features
            ? {
                  ...device.features,
                  device_id: REDACTED_REPLACEMENT,
                  label: device.features.label ? REDACTED_REPLACEMENT : undefined,
              }
            : undefined,
        metadata: device.metadata ? REDACTED_REPLACEMENT : undefined,
    };
};

export const redactAction = (action: LogEntry) => {
    let payload;

    switch (action.type) {
        case accountsActions.updateSelectedAccount.type:
            payload = {
                ...action.payload,
                account: redactAccount(action.payload?.account),
                network: undefined,
                discovery: undefined,
            };
            break;
        case accountsActions.createAccount.type:
        case accountsActions.updateAccount.type:
            payload = redactAccount(action.payload);
            break;
        case SUITE.AUTH_DEVICE:
            payload = {
                state: REDACTED_REPLACEMENT,
                ...redactDevice(action.payload),
            };
            break;
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
        case SUITE.UPDATE_SELECTED_DEVICE:
        case SUITE.REMEMBER_DEVICE:
            payload = redactDevice(action.payload);
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

export const getApplicationInfo = (state: AppState, hideSensitiveInfo: boolean) => ({
    environment: getEnvironment(),
    suiteVersion: process.env.VERSION || '',
    commitHash: process.env.COMMITHASH || '',
    startTime,
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
    instanceId: hideSensitiveInfo ? REDACTED_REPLACEMENT : state.analytics.instanceId,
    sessionId: hideSensitiveInfo ? REDACTED_REPLACEMENT : state.analytics.sessionId,
    transport: state.suite.transport?.type,
    transportVersion: state.suite.transport?.version,
    rememberedStandardWallets: state.devices.filter(d => d.remember && d.useEmptyPassphrase).length,
    rememberedHiddenWallets: state.devices.filter(d => d.remember && !d.useEmptyPassphrase).length,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    customBackends: getCustomBackends(state.wallet.blockchain)
        .map(({ coin }) => coin)
        .filter(coin => state.wallet.settings.enabledNetworks.includes(coin)),
    devices: getPhysicalDeviceUniqueIds(state.devices)
        .map(id => state.devices.find(device => device.id === id) as TrezorDevice) // filter unique devices
        .concat(state.devices.filter(device => device.id === null)) // add devices in bootloader mode
        .map(device => ({
            id: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.id,
            label: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.label,
            mode: device.mode,
            connected: device.connected,
            passphraseProtection: device.features?.passphrase_protection,
            model: getDeviceModel(device),
            firmware: device.features ? getFwVersion(device) : '',
            firmwareRevision: device.features ? getFwRevision(device) : '',
            firmwareType: device.features ? getFwType(device) : '',
            bootloader: device.features ? getBootloaderVersion(device) : '',
            bootloaderHash: device.features ? getBootloaderHash(device) : '',
            numberOfWallets:
                device.mode !== 'bootloader'
                    ? state.devices.filter(d => d.id === device.id).length
                    : 1,
        })),
    wallets: state.devices.map(device => ({
        deviceId: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.id,
        deviceLabel: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.label,
        label:
            // eslint-disable-next-line no-nested-ternary
            device.metadata.status === 'enabled'
                ? hideSensitiveInfo
                    ? REDACTED_REPLACEMENT
                    : device.metadata.walletLabel
                : '',
        connected: device.connected,
        remember: device.remember,
        useEmptyPassphrase: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.useEmptyPassphrase,
    })),
});
