import {
    deviceActions,
    discoveryActions,
    accountsActions,
    selectDevices,
} from '@suite-common/wallet-core';
import {
    getEnvironment,
    getBrowserName,
    getBrowserVersion,
    getCommitHash,
    getOsName,
    getOsVersion,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getSuiteVersion,
    getWindowHeight,
    getWindowWidth,
    isCodesignBuild,
} from '@trezor/env-utils';
import { LogEntry } from '@suite-common/logger';
import { DEVICE } from '@trezor/connect';
import { getCustomBackends } from '@suite-common/wallet-utils';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';
import { DeepPartial } from '@trezor/type-utils';
import { Discovery } from '@suite-common/wallet-types';
import { getPhysicalDeviceUniqueIds } from '@suite-common/suite-utils';

import { getIsTorEnabled } from 'src/utils/suite/tor';
import { AppState, TrezorDevice } from 'src/types/suite';
import { METADATA_LABELING } from 'src/actions/suite/constants';
import { Account } from 'src/types/wallet';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';

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
                  session_id: device.features.session_id ? REDACTED_REPLACEMENT : undefined,
                  label: device.features.label ? REDACTED_REPLACEMENT : undefined,
              }
            : undefined,
        metadata: device.metadata ? REDACTED_REPLACEMENT : undefined,
    };
};

export const redactAction = (action: LogEntry) => {
    let payload;

    if (accountsActions.updateSelectedAccount.match(action)) {
        payload = {
            ...action.payload,
            account: redactAccount(action.payload?.account),
            network: undefined,
            discovery: undefined,
        };
    }

    if (deviceActions.authDevice.match(action)) {
        payload = {
            state: REDACTED_REPLACEMENT,
            ...redactDevice(action.payload.device),
        };
    }

    switch (action.type) {
        case accountsActions.createAccount.type:
        case accountsActions.updateAccount.type:
            payload = redactAccount(action.payload);
            break;
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
        case deviceActions.updateSelectedDevice.type:
        case deviceActions.rememberDevice.type:
            payload = redactDevice(action.payload);
            break;
        case discoveryActions.completeDiscovery.type:
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
    suiteVersion: getSuiteVersion(),
    commitHash: getCommitHash(),
    startTime,
    isDev: !isCodesignBuild(),
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
    // todo: duplicated with suite/src/utils/suite/analytics
    labeling: state.metadata.enabled
        ? state.metadata.providers.find(p => p.clientId === state.metadata.selectedProvider.labels)
              ?.type || 'missing-provider'
        : '',
    analytics: state.analytics.enabled,
    instanceId: hideSensitiveInfo ? REDACTED_REPLACEMENT : state.analytics.instanceId,
    sessionId: hideSensitiveInfo ? REDACTED_REPLACEMENT : state.analytics.sessionId,
    transport: state.suite.transport?.type,
    transportVersion: state.suite.transport?.version,
    rememberedStandardWallets: selectDevices(state).filter(d => d.remember && d.useEmptyPassphrase)
        .length,
    rememberedHiddenWallets: selectDevices(state).filter(d => d.remember && !d.useEmptyPassphrase)
        .length,
    enabledNetworks: state.wallet.settings.enabledNetworks,
    customBackends: getCustomBackends(state.wallet.blockchain)
        .map(({ coin }) => coin)
        .filter(coin => state.wallet.settings.enabledNetworks.includes(coin)),
    devices: getPhysicalDeviceUniqueIds(selectDevices(state))
        .map(id => selectDevices(state).find(device => device.id === id) as TrezorDevice) // filter unique devices
        .concat(selectDevices(state).filter(device => device.id === null)) // add devices in bootloader mode
        .map(device => ({
            id: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.id,
            label: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.label,
            mode: device.mode,
            connected: device.connected,
            passphraseProtection: device.features?.passphrase_protection,
            model: device.features?.internal_model,
            firmware: device.features ? getFirmwareVersion(device) : '',
            firmwareRevision: device.features ? getFirmwareRevision(device) : '',
            firmwareType: device.firmwareType || '',
            bootloader: device.features ? getBootloaderVersion(device) : '',
            bootloaderHash: device.features ? getBootloaderHash(device) : '',
            numberOfWallets:
                device.mode !== 'bootloader'
                    ? selectDevices(state).filter(d => d.id === device.id).length
                    : 1,
        })),
    wallets: selectDevices(state).map(device => ({
        deviceId: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.id,
        deviceLabel: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.label,
        label:
            // eslint-disable-next-line no-nested-ternary
            device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]
                ? hideSensitiveInfo
                    ? REDACTED_REPLACEMENT
                    : selectLabelingDataForWallet(state).walletLabel
                : '',
        connected: device.connected,
        remember: device.remember,
        useEmptyPassphrase: hideSensitiveInfo ? REDACTED_REPLACEMENT : device.useEmptyPassphrase,
    })),
});
