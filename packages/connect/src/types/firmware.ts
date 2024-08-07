import { DeviceModelInternal } from '@trezor/protobuf';
import { Type } from '@trezor/schema-utils';

export type FirmwareRange = Record<
    DeviceModelInternal,
    {
        min: string;
        max: string;
    }
>;

export type VersionArray = [number, number, number];

export type FirmwareRelease = {
    required: boolean;
    url: string;
    fingerprint: string;
    changelog: string | string[];
    changelog_bitcoinonly?: string | string[]; // Added later, may not be there for older releases
    firmware_revision?: string;
    version: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    bootloader_version?: VersionArray;
    url_bitcoinonly?: string;
    fingerprint_bitcoinonly?: string;
    channel?: string;
    translations?: string[];
};

export type IntermediaryVersion = 1 | 2 | 3;
export const IntermediaryVersion = Type.Union([Type.Literal(1), Type.Literal(2), Type.Literal(3)]);

export type ReleaseInfo = {
    changelog: FirmwareRelease[] | null;
    release: FirmwareRelease;
    isRequired: boolean | null;
    isNewer: boolean | null;
    /**
     * v1 - bootloader < 1.8.0
     * v2 - bootloader >= 1.8.0, < 1.12.0
     * v3 - bootloader >= 1.12.0
     */
    intermediaryVersion?: IntermediaryVersion;
    translations?: string[];
};
