import { DeviceModelInternal, FirmwareType, VersionArray } from '@trezor/device-utils';

export interface ReleaseInfo {
    required: boolean;
    version: VersionArray;
    bootloader_version?: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    translations: string[];
    firmware_revision?: string;
    fingerprint: string;
    changelog?: string;
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

export type ReleasesConfig = Record<DeviceModelInternal, ConditionalRelease[]>;

export interface IntermediaryReleaseConfig {
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    version: number;
}

export interface FirmwareReleaseConfig {
    version: number;
    timestamp: string;
    sequence: number;
    releases: ReleasesConfig;
    intermediaries: Record<DeviceModelInternal, IntermediaryReleaseConfig[]>;
}
