import type {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareRelease,
    FirmwareType,
    IntermediaryReleaseConfig,
} from '@trezor/device-utils';
import type { RequireAtLeastOne } from '@trezor/type-utils';
import type { VersionArray } from '@trezor/utils';

export type FirmwareBoundary = `${number}.${number}.${number}` | '0';

export type FirmwareRange = Record<
    DeviceModelInternal,
    { min: FirmwareBoundary; max: FirmwareBoundary }
>;

export type FirmwareCapability =
    | 'replaceTransaction'
    | 'amountUnit'
    | 'decreaseOutput'
    | 'eip1559'
    | 'eip7702'
    | 'taproot'
    | 'signMessageNoScriptType'
    | 'eip712-domain-only'
    | 'coinjoin'
    | 'tutorial'
    | 'tropicDeviceAuthentication'
    | 'mcuDeviceAuthentication'
    | 'authenticityProofChunk'
    | 'getFirmwareHash'
    | 'chunkify'
    | 'entropyCheck'
    | 'evmApproval'
    | 'slip24'
    | 'evolu'
    | 'monero'
    | 'telemetry'
    | 'evmClearSigning';

type RuleSelector = RequireAtLeastOne<{
    coin: Lowercase<string>[];
    coinType: string;
    methods: string[];
    capabilities: FirmwareCapability[];
}>;

type RuleDeclaration = RequireAtLeastOne<{
    min: Partial<Record<DeviceModelInternal, FirmwareBoundary>>;
    max: Partial<Record<DeviceModelInternal, FirmwareBoundary>>;
}>;

// Distinguishes officially signed firmware (`production`) from debug / emulator /
// unsigned local builds (`debug`). Detected from `Features.fw_vendor`.
export type FirmwareBuildType = 'debug' | 'production';

export type FirmwareRule = RuleSelector &
    RuleDeclaration & {
        comment?: string[];
        // When set, the rule applies only to devices running a firmware
        // build of the matching type. Omitted = the rule applies to both.
        firmwareType?: FirmwareBuildType;
    };

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
    'reboot_and_wait' | 'reboot_and_upgrade' | 'manual' | 'unknown_flow';

export type FirmwareChannel =
    | 'production'
    | 'production-early-access'
    | 'test-unsigned'
    | 'test-unsigned-stable'
    | 'test-signed'
    | 'localhost-unsigned'
    | 'localhost-signed';

export type CurrentVersion = {
    bootloaderVersion: VersionArray | null;
    firmwareVersion: VersionArray | null;
};
