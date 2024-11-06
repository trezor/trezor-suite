import { Static, Type } from '@trezor/schema-utils';

import type { Params, Response } from '../params';

export type FirmwareUpdate = Static<typeof FirmwareUpdate>;
export const FirmwareUpdate = Type.Union([
    Type.Object({
        binary: Type.Optional(Type.Undefined()),
        btcOnly: Type.Optional(Type.Boolean()),
        baseUrl: Type.Optional(Type.String()),
        language: Type.Optional(Type.String()),
    }),
    Type.Object({
        binary: Type.ArrayBuffer(),
    }),
]);

export type FirmwareUpdateResponse =
    | {
          check:
              | 'mismatch' //  firmware is not legitimate
              | 'valid' // ok
              | 'omitted'; // custom fw binary, or maybe older fw
      }
    | {
          check: 'other-error';
          checkError: string; // unable to carry out the check due to a non-related error such as disconnected device
      };

export declare function firmwareUpdate(
    params: Params<FirmwareUpdate>,
): Response<FirmwareUpdateResponse>;
