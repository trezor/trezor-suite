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
    fingerprint: string;
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

export interface ReleasesConfig {
    T1B1: ConditionalRelease[];
    T2T1: ConditionalRelease[];
    T2B1: ConditionalRelease[];
    T3B1: ConditionalRelease[];
    T3T1: ConditionalRelease[];
    T3W1: ConditionalRelease[];
}
export interface IntermediaryReleaseConfig {
    if_version_less_than: string;
    version: number;
    firmware_revision: string;
    url: string;
}

export interface FirmwareReleaseConfig {
    version: number;
    timestamp: string;
    sequence: number;
    releases: ReleasesConfig;
    intermediaries: Record<DeviceModelInternal, IntermediaryReleaseConfig[]>;
}
