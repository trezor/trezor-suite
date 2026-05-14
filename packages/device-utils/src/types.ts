import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { type DeviceModelInternal } from './deviceModelInternal';

export type FirmwareVersionString = `${number}.${number}.${number}`;

export enum FirmwareType {
    BitcoinOnly = 'bitcoin-only',
    Universal = 'universal',
}

export type FeaturesNarrowing =
    | {
          major_version: 2;
          minor_version: number;
          patch_version: number;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: true;
          firmware_present: false;
      }
    | {
          major_version: 2;
          minor_version: number;
          patch_version: number;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: null;
          firmware_present: null;
      }
    | {
          major_version: 2;
          minor_version: number;
          patch_version: number;
          fw_major: 2;
          fw_minor: number;
          fw_patch: number;
          bootloader_mode: true;
          firmware_present: true;
      }
    | {
          major_version: 1;
          minor_version: number;
          patch_version: number;
          // Old T1B1 versions do not report FW version in bootloader mode, then it cannot be known
          fw_major: 1 | null;
          fw_minor: number | null;
          fw_patch: number | null;
          bootloader_mode: true;
          firmware_present: true;
      }
    | {
          major_version: 1;
          minor_version: number;
          patch_version: number;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: true;
          firmware_present: false;
      }
    | {
          major_version: 1;
          minor_version: number;
          patch_version: number;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: null;
          firmware_present: null;
      };

export type PartialDevice = {
    firmwareType?: FirmwareType;
    authenticityChecks?: {
        firmwareRevision: { success: boolean } | null;
        firmwareHash: { success: boolean } | null;
    };
    mode?: 'normal' | 'bootloader' | 'initialize' | 'seedless';

    features?: PROTO.Features;
};

export type FirmwareSource = 'official' | 'unknown' | 'NA - bootloader';

// Type `FirmwareRelease` is the original in releases.json probably we should get rid of it once this is replaced by the new FirmwareReleaseConfig
export type FirmwareRelease = {
    required: boolean;
    url: string;
    version: VersionArray;
    bootloader_version?: VersionArray;
    min_firmware_version: VersionArray;
    min_bootloader_version: VersionArray;
    translations: Record<string, string>;
    firmware_revision?: string;
    fingerprint: string;
    changelog?: string;
};

export interface ConditionalRelease {
    firmware_type: FirmwareType;
    conditions: {
        environment: {
            min_suite_version: string;
            min_suite_native_version: string;
        };
        rollout_probability: number;
    };
    releasePath: string;
    release?: FirmwareRelease;
}

export type ReleasesConfig = Record<DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>;

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
