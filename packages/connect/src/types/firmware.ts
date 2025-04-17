import {
    ConditionalRelease,
    IntermediaryRelease,
} from '@trezor/connect-message-releases/src/types';
import { DeviceModelInternal, VersionArray } from '@trezor/device-utils';
import { Type } from '@trezor/schema-utils';

export type FirmwareRange = Record<
    DeviceModelInternal,
    {
        min: string;
        max: string;
    }
>;

// export type FirmwareMessageRelease = ConditionalRelease['release'];

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
    translations?: string[];
};

export type ReleaseMessageInfo = {
    changelog: FirmwareRelease[] | null;
    releaseConditions: ConditionalRelease['conditions'] & { shouldBeOffered: boolean };
    release: ConditionalRelease['release'];
    intermediary: IntermediaryRelease | undefined;
    isRequired: boolean | null;
    isNewer: boolean | null;
    translations?: string[];
};
