import { Static, Type } from '@trezor/schema-utils';
import { DeviceAuthenticityConfig } from '../../data/deviceAuthenticityConfig';
import type { Params, Response } from '../params';

export type AuthenticateDeviceParams = Static<typeof AuthenticateDeviceParams>;
export const AuthenticateDeviceParams = Type.Object({
    config: Type.Optional(DeviceAuthenticityConfig),
    allowDebugKeys: Type.Optional(Type.Boolean()),
});

export type AuthenticateDeviceResult =
    | {
          valid: true;
          caPubKey: string;
          debugKey?: boolean;
          configExpired?: typeof undefined;
          error?: typeof undefined;
      }
    | {
          valid: false;
          caPubKey: string;
          debugKey?: boolean;
          configExpired?: boolean;
          error:
              | 'ROOT_PUBKEY_NOT_FOUND'
              | 'CA_PUBKEY_NOT_FOUND'
              | 'INVALID_DEVICE_MODEL'
              | 'INVALID_DEVICE_CERTIFICATE'
              | 'INVALID_DEVICE_SIGNATURE';
      };

export declare function authenticateDevice(
    params: Params<AuthenticateDeviceParams>,
): Response<AuthenticateDeviceResult>;
