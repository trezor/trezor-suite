import { deviceActions } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getBrowserName, getBrowserVersion, getOsVersion } from '@suite-common/suite-utils';
import { accountsActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { DEVICE } from '@trezor/connect';
import {
    getCommitHash,
    getEnvironment,
    getOsName,
    getPlatformLanguages,
    getScreenHeight,
    getScreenWidth,
    getSuiteVersion,
    getWindowHeight,
    getWindowWidth,
    isCodesignBuild,
} from '@trezor/env-utils';
import { type DeepPartial } from '@trezor/type-utils';

import { type LogEntry } from './types';

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

export const redactDevice = (device: DeepPartial<TrezorDevice> | undefined) => {
    if (!device) return undefined;

    return {
        ...device,
        id: REDACTED_REPLACEMENT,
        label: device.label ? REDACTED_REPLACEMENT : undefined,
        state: REDACTED_REPLACEMENT,
        firmwareReleaseConfigInfo: device.firmwareReleaseConfigInfo
            ? REDACTED_REPLACEMENT
            : undefined,
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

    switch (action.type) {
        case accountsActions.createAccount.type:
        case accountsActions.updateAccount.type:
            payload = redactAccount(action.payload);
            break;
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
        case deviceActions.updateSelectedDevice.type:
        case deviceActions.setRememberDevice.type:
            payload = redactDevice(action.payload);
            break;
        default:
            return action;
    }

    return {
        ...action,
        payload,
    };
};

export const getEnvironmentInfo = async () => ({
    environment: getEnvironment(),
    suiteVersion: getSuiteVersion(),
    commitHash: getCommitHash(),
    isDev: !isCodesignBuild(),
    browserName: getBrowserName(),
    browserVersion: getBrowserVersion(),
    osName: getOsName(),
    osVersion: await getOsVersion(),
    windowWidth: getWindowWidth(),
    windowHeight: getWindowHeight(),
    screenWidth: getScreenWidth(),
    screenHeight: getScreenHeight(),
    platformLanguages: getPlatformLanguages().join(','),
});

export type LogsEnvironmentInfo = Awaited<ReturnType<typeof getEnvironmentInfo>>;
