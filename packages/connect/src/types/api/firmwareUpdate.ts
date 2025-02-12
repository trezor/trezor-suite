import { Static, Type } from '@trezor/schema-utils';

import type { VersionArray } from '../firmware';
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

export type FirmwareUpdateResponse = {
    versionCheck: boolean; // installedVersion == binaryVersion == releaseVersion
    bootloaderVersion: VersionArray; // bootloader version
    installedVersion: VersionArray; // version installed by this process
    binaryVersion: VersionArray; // version read from the binary
    releaseVersion?: VersionArray; // version offered automatically by config. undefined if params.binary is used
};

export declare function firmwareUpdate(
    params: Params<FirmwareUpdate>,
): Response<FirmwareUpdateResponse>;
