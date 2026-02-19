import type { ThpSuiteCredentials } from '@suite-common/suite-types';
import type { DeviceThpState } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

// This file is intentionally not reexported in index.ts, so that bundler won't have to import.

/**
 * Generate a mock THP credential.
 */
export const createCredential = (
    partialCredential?: Partial<ThpSuiteCredentials>,
): ThpSuiteCredentials => ({
    credential: 'default-credential',
    host_static_key: 'host_static_key',
    trezor_static_public_key: 'random-static-public-key',
    connectionCounter: 0,
    autoconnect: false,
    ...partialCredential,
});

/**
 * Generate a mock device.thp properties as they are on a readable device
 */
export const createDeviceThp = (partialDeviceThp?: Partial<DeviceThpState>): DeviceThpState => ({
    properties: {
        internal_model: DeviceModelInternal.T3W1,
        model_variant: 0,
        protocol_version_major: 2,
        protocol_version_minor: 0,
        pairing_methods: [],
    },
    channel: 'channel-id',
    credentials: [createCredential()],
    ...partialDeviceThp,
});
