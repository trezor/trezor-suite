import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import type { DeviceAuthenticityConfig } from './config/deviceAuthenticityConfigTypes';

export type VerifySignature = (
    rawKey: Buffer,
    data: Uint8Array,
    signature: Uint8Array,
) => Promise<boolean>;

export type VerifyAuthenticityProofParams = {
    challenge: Buffer;
    certificates: string[];
    signature: string;
    deviceModel: keyof typeof PROTO.DeviceModelInternal; // Device.features.internal_model
    config: DeviceAuthenticityConfig;
    blacklistConfig: DeviceAuthenticityBlacklistConfig;
    allowDebugKeys?: boolean;
};

export type VerifyAuthenticityProofResult =
    | {
          valid: true;
          caPubKey: string;
          rootPubKey: string;
          error?: typeof undefined;
      }
    | {
          valid: false;
          caPubKey: string;
          rootPubKey?: string;
          error:
              | 'ROOT_PUBKEY_NOT_FOUND'
              | 'CA_PUBKEY_BLACKLISTED'
              | 'INVALID_DEVICE_MODEL'
              | 'INVALID_DEVICE_CERTIFICATE'
              | 'INVALID_DEVICE_SIGNATURE';
      };
