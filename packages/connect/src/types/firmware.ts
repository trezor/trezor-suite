import type {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    IntermediaryReleaseConfig,
} from '@trezor/device-utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

export type CurrentVersion = {
    bootloaderVersion: VersionArray | null;
    firmwareVersion: VersionArray | null;
};

export type FirmwareRange = Record<
    DeviceModelInternal,
    {
        min: string;
        max: string;
    }
>;

export type BinaryInfo = {
    binary: ArrayBuffer;
    binaryVersion: VersionArray;
    release?: FirmwareRelease;
};

export type FirmwareReleaseConfigInfo = {
    firmwareType: FirmwareType;
    isBitcoinOnlyAvailable: boolean;
    releaseConditions: ConditionalRelease['conditions'] & { shouldBeOffered: boolean };
    release: FirmwareRelease;
    intermediary: IntermediaryReleaseConfig | undefined;
    isRequired: boolean | null;
    isNewer: boolean | null;
    translations?: Record<string, string>;
};

/**
 * 'reboot_and_upgrade': after confirming reboot to bootloader, FW updates automatically.
 *      Case: 2.x.x when upgrading FW version.
 * 'reboot_and_wait': after confirming reboot to bootloader, device needs user confirmation before the update itself.
 *      Case: the usual case for 1.x.x, or 2.x.x manual reinstall / downgrade / switch BTC-only.
 * 'manual': user needs to manually reconnect device during the update flow when prompted.
 *      Case: firmware version less than 1.10.0, 2.6.0 (corresponds to bootloader versions 1.10.0, 2.1.0).
 * 'unknown_flow': when device starts in bootloader, the flow type cannot be reliably determined (can't tell FW version).
 *      Case: fresh device with no FW (most usual case).
 */
export type FirmwareUpdateFlowType =
    | 'reboot_and_wait'
    | 'reboot_and_upgrade'
    | 'manual'
    | 'unknown_flow';

export type FirmwareChannel =
    | 'production'
    | 'production-early-access'
    | 'test-unsigned'
    | 'test-unsigned-stable'
    | 'test-signed'
    | 'localhost-unsigned'
    | 'localhost-signed';
