import * as crypto from 'crypto';

import { type MessagesSchema as PROTO } from '@trezor/protobuf';

import type { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import {
    type CertPubKeys,
    type DeviceAuthenticityConfig,
} from './config/deviceAuthenticityConfigTypes';
import type { ProofType } from './types';

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
    proofType: ProofType;
    config: DeviceAuthenticityConfig;
    deviceModel: keyof typeof PROTO.DeviceModelInternal;
    allowDebugKeys?: boolean;
};

type ModelConfigKey = keyof CertPubKeys;
const modelConfigKeyPerProofType: Record<ProofType, ModelConfigKey> = {
    optiga: 'rootPubKeysOptiga',
    tropic: 'rootPubKeysTropic',
    mcu: 'rootPubKeysMLDSA',
};

/**
 * Select all rootPubKeys for particular model, depending if debug keys are allowed.
 * For simplicity, keys for all curves are combined, though only some of them may pass for each respective certificate/signature.
 */
export const getRootPubKeys = ({
    proofType,
    config,
    deviceModel,
    allowDebugKeys,
}: GetRootPubKeysParams): string[] => {
    const modelConfig = config[deviceModel];
    if (modelConfig === undefined) {
        throw new Error(`Pubkeys for ${deviceModel} not found in config`);
    }

    const modelConfigKey = modelConfigKeyPerProofType[proofType];
    const rootPubKeysProd = modelConfig[modelConfigKey] ?? [];
    const rootPubKeysDebug = modelConfig.debug?.[modelConfigKey] ?? [];

    return allowDebugKeys ? [...rootPubKeysProd, ...rootPubKeysDebug] : rootPubKeysProd;
};
