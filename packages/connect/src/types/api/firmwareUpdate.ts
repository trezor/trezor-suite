import { Static, Type } from '@trezor/schema-utils';
import { IntermediaryVersion } from '../firmware';
import type { Params, Response } from '../params';

export type FirmwareUpdate = Static<typeof FirmwareUpdate>;
export const FirmwareUpdate = Type.Union([
    Type.Object({
        binary: Type.Optional(Type.Undefined()),
        version: Type.Array(Type.Number()),
        btcOnly: Type.Optional(Type.Boolean()),
        baseUrl: Type.Optional(Type.String()),
        intermediaryVersion: Type.Optional(IntermediaryVersion),
    }),
    Type.Object({
        binary: Type.ArrayBuffer(),
    }),
]);

export interface FirmwareUpdateResponse {
    hash: string;
    challenge: string;
}

export declare function firmwareUpdate(
    params: Params<FirmwareUpdate>,
): Response<FirmwareUpdateResponse>;
