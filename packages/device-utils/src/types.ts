export type FirmwareVersionString = `${number}.${number}.${number}`;

export enum FirmwareType {
    BitcoinOnly = 'bitcoin-only',
    Regular = 'regular',
}

export type VersionArray = [number, number, number];

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
          bootloader_mode: true;
          firmware_present: true;
      };

// todo: this is copy-pasted from packages/protobuf/src/messages
export type PartialDevice = {
    firmwareType?: FirmwareType;
    authenticityChecks?: {
        firmwareRevision: { success: boolean } | null;
        firmwareHash: { success: boolean } | null;
    };
    mode?: 'normal' | 'bootloader' | 'initialize' | 'seedless';

    features?: {
        major_version: number;
        minor_version: number;
        patch_version: number;
        bootloader_mode: boolean | null;
        initialized: boolean | null;
        revision: string | null;
        bootloader_hash: string | null;
        fw_major: number | null;
        fw_minor: number | null;
        fw_patch: number | null;
        no_backup: boolean | null;
        unit_btconly?: boolean;
    };
};

export type FirmwareSource = 'official' | 'unknown' | 'NA - bootloader';

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
