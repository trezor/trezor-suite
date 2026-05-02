import { type MessagesSchema as PROTO } from '@trezor/protobuf';

import type { DeviceAuthenticityBlacklistConfig } from './config/deviceAuthenticityBlacklistConfigTypes';
import type { DeviceAuthenticityConfig } from './config/deviceAuthenticityConfigTypes';

export type VerifySignature = (
    rawKey: Buffer,
    data: Uint8Array,
    signature: Uint8Array,
) => boolean | Promise<boolean>;

export type PrepareDeviceAuthenticityDataParams = {
    payload: Buffer | Buffer[];
    prefix?: string;
};

export type VerifyAuthenticityProofParams = {
    certificates: string[];
    signature: string;
    signedData: Uint8Array;
    deviceModel: keyof typeof PROTO.DeviceModelInternal; // Device.features.internal_model
    config: DeviceAuthenticityConfig;
    blacklistConfig: DeviceAuthenticityBlacklistConfig;
    allowDebugKeys?: boolean;
};

export type VerifyAuthenticityProofResult =
    | {
          valid: true;
          caPubKey?: string;
          rootPubKey: string;
          error?: typeof undefined;
          serialNumber?: string;
      }
    | {
          valid: false;
          caPubKey?: string;
          rootPubKey?: string;
          serialNumber?: string;
          error:
              | 'ROOT_PUBKEY_NOT_FOUND'
              | 'CA_PUBKEY_BLACKLISTED'
              | 'INVALID_DEVICE_MODEL'
              | 'INVALID_DEVICE_CERTIFICATE'
              | 'INVALID_DEVICE_SIGNATURE'
              | 'RESPONSE_PAYLOAD_MISSING'
              | 'RESPONSE_MALFORMED'
              | 'SERIAL_NUMBER_MISMATCH';
      };

export type ResultsToValidate = {
    optigaResult: VerifyAuthenticityProofResult;
    tropicResult: VerifyAuthenticityProofResult | null;
    mcuResult: VerifyAuthenticityProofResult | null;
};
