import type { ThpSuiteCredentials } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';
import type { ThpStateSerialized } from '@trezor/protocol';

// This file is intentionally not reexported in index.ts, so that bundler won't have to import.

/**
 * Generate a mock THP credential.
 */
export const createCredential = (
    partialCredential?: Partial<ThpSuiteCredentials>,
): ThpSuiteCredentials => ({
    credential: 'default-credential',
    trezor_static_public_key: 'random-static-public-key',
    connectionCounter: 0,
    autoconnect: false,
    ...partialCredential,
});

/**
 * Generate a mock device.thp properties as they are on a readable device
 */
export const createDeviceThp = (
    partialDeviceThp?: Partial<ThpStateSerialized>,
): ThpStateSerialized => ({
    properties: {
        internal_model: DeviceModelInternal.T3W1,
        model_variant: 0,
        protocol_version_major: 2,
        protocol_version_minor: 0,
        pairing_methods: [],
    },
    channel: 'channel-id',
    sendBit: 0,
    recvBit: 0,
    sendAckBit: 0,
    recvAckBit: 0,
    sendNonce: 1,
    recvNonce: 2,
    expectedResponses: [1],
    credentials: [createCredential()],
    ...partialDeviceThp,
});
