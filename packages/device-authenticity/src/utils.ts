import * as crypto from 'crypto';

import { type MessagesSchema as PROTO } from '@trezor/protobuf';

import type { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import type { DeviceAuthenticityConfig } from './config/deviceAuthenticityConfigTypes';

export const getRandomChallenge = () => crypto.randomBytes(32);

type GetCaPubKeyBlacklistParams = {
    blacklistConfig: DeviceAuthenticityBlacklistConfig;
    allowDebugKeys?: boolean;
};
export const getCaPubKeyBlacklist = ({
    blacklistConfig,
    allowDebugKeys,
}: GetCaPubKeyBlacklistParams): string[] => {
    const normalBlacklist = blacklistConfig.blacklistedCaPubKeys ?? [];
    const debugBlacklist = blacklistConfig.debug?.blacklistedCaPubKeys ?? [];

    return allowDebugKeys ? normalBlacklist.concat(debugBlacklist) : normalBlacklist;
};

type GetRootPubKeysParams = {
    config: DeviceAuthenticityConfig;
    deviceModel: keyof typeof PROTO.DeviceModelInternal;
    allowDebugKeys?: boolean;
};

/**
 * Select all rootPubKeys for particular model, depending if debug keys are allowed.
 * For simplicity, keys for all curves are combined, though only some of them may pass for each respective certificate/signature.
 */
export const getRootPubKeys = ({
    config,
    deviceModel,
    allowDebugKeys,
}: GetRootPubKeysParams): string[] => {
    const modelConfig = config[deviceModel];
    if (modelConfig === undefined) {
        throw new Error(`Pubkeys for ${deviceModel} not found in config`);
    }

    const rootPubKeysNormalOptiga = modelConfig.rootPubKeysOptiga ?? [];
    const rootPubKeysNormalTropic = modelConfig.rootPubKeysTropic ?? [];
    const rootPubKeysDebugOptiga = modelConfig.debug?.rootPubKeysOptiga ?? [];
    const rootPubKeysDebugTropic = modelConfig.debug?.rootPubKeysTropic ?? [];
    const rootPubKeysNormal = [...rootPubKeysNormalOptiga, ...rootPubKeysNormalTropic];
    if (!allowDebugKeys) return rootPubKeysNormal;

    return [...rootPubKeysNormal, ...rootPubKeysDebugOptiga, ...rootPubKeysDebugTropic];
};
