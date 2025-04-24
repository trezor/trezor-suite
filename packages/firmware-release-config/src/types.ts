import { DeviceModelInternal, FirmwareType, VersionArray } from '@trezor/device-utils';

export interface ReleaseOriginal {
    required: boolean;
    version: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    bootloader_version: VersionArray;
    translations: string[];
    url: string;
    url_bitcoinonly: string;
    fingerprint: string;
    fingerprint_bitcoinonly: string;
    firmware_revision: string;
    changelog: string;
    changelog_bitcoinonly: string;
}

export interface ReleaseInfo {
    required: boolean;
    version: VersionArray;
    bootloader_version: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    translations: string[];
    firmware_revision: string;
    changelog: string;
}

export interface ConditionalRelease {
    firmware_type: FirmwareType;
    conditions: {
        environment: {
            min_suite_version: string;
        };
        rollout_probability: number;
    };
    release: ReleaseInfo;
}

export interface Releases {
    T1B1: ConditionalRelease[];
    T2T1: ConditionalRelease[];
    T2B1: ConditionalRelease[];
    T3B1: ConditionalRelease[];
    T3T1: ConditionalRelease[];
    T3W1: ConditionalRelease[];
    UNKNOWN: ConditionalRelease[];
}
export interface IntermediaryRelease {
    if_version_less_than: string;
    version: number;
    firmware_revision: string;
    url: string;
}

export interface ReleaseMessage {
    version: number;
    timestamp: string;
    sequence: number;
    releases: Releases;
    intermediaries: Record<DeviceModelInternal, IntermediaryRelease[]>;
}
