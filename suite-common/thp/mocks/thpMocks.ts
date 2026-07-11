import type { ThpSuiteCredentials } from '@suite-common/suite-types';
import type { DeviceThpState } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { asHostStaticKeyHex, asThpCredentialId, asTrezorStaticPublicKey } from '@trezor/protocol';

// This file is intentionally not reexported in index.ts, so that bundler won't have to import.

// The branded key fields are accepted as plain strings here and branded internally,
// so test fixtures can keep passing raw string overrides (e.g. `{ credential: '1' }`).
type CreateCredentialInput = Partial<
    Omit<ThpSuiteCredentials, 'credential' | 'host_static_key' | 'trezor_static_public_key'>
> & {
    credential?: string;
    host_static_key?: string;
    trezor_static_public_key?: string;
};

/**
 * Generate a mock THP credential.
 */
export const createCredential = (
    partialCredential?: CreateCredentialInput,
): ThpSuiteCredentials => {
    const {
        credential = 'default-credential',
        host_static_key = 'host_static_key',
        trezor_static_public_key = 'random-static-public-key',
        ...rest
    } = partialCredential ?? {};

    return {
        credential: asThpCredentialId(credential),
        host_static_key: asHostStaticKeyHex(host_static_key),
        trezor_static_public_key: asTrezorStaticPublicKey(trezor_static_public_key),
        connectionCounter: 0,
        autoconnect: false,
        ...rest,
    };
};

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
