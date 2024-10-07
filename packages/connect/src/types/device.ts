import type { PROTO } from '../constants';
import type { ReleaseInfo } from './firmware';

/**
 * - `available`  no other application has an active session
 * - `occupied`   other application has an active session
 * - `used`       another has released the device and no other application has an active session
 */
export type DeviceStatus = 'available' | 'occupied' | 'used';

export type DeviceMode = 'normal' | 'bootloader' | 'initialize' | 'seedless';

export type DeviceFirmwareStatus =
    | 'valid'
    | 'outdated'
    | 'required'
    | 'unknown'
    | 'custom'
    | 'none';

export type UnavailableCapability =
    | 'no-capability'
    | 'no-support'
    | 'update-required'
    | 'trezor-connect-outdated';

export enum FirmwareType {
    BitcoinOnly = 'bitcoin-only',
    Regular = 'regular',
}

export type StaticSessionId = `${string}@${string}:${number}`;

export type DeviceState = {
    sessionId?: string; // dynamic value: Features.session_id
    // ${first testnet address}@${device.features.device_id}:${device.instance}
    staticSessionId?: StaticSessionId;
};

// NOTE: unavailableCapabilities is an object with information what is NOT supported by this device.
// in ideal/expected setup this object should be empty but given setup might have exceptions.
// key = coin shortcut lowercase (ex: btc, eth, xrp) OR field declared in coins.json "supportedFirmware.capability"
export type UnavailableCapabilities = { [key: string]: UnavailableCapability };

export type FirmwareRevisionCheckError =
    | 'revision-mismatch'
    | 'firmware-version-unknown'
    | 'cannot-perform-check-offline' // suite offline & release version not found locally => we cannot check with `data.trezor.io`
    | 'other-error'; // incorrect URL, cannot parse JSON, etc.

export type FirmwareRevisionCheckResult =
    | { success: true }
    | {
          success: false;
          error: FirmwareRevisionCheckError;
      };

export type FirmwareHashCheckError =
    | 'hash-mismatch'
    | 'check-skipped'
    | 'check-unsupported'
    | 'unknown-release'
    | 'other-error';
export type FirmwareHashCheckResult =
    | { success: true }
    | { success: false; error: FirmwareHashCheckError };

type BaseDevice = {
    path: string;
    name: string;
};

export type KnownDevice = BaseDevice & {
    type: 'acquired';
    id: string | null;
    /** @deprecated, use features.label instead */
    label: string;
    error?: typeof undefined;
    firmware: DeviceFirmwareStatus;
    firmwareRelease?: ReleaseInfo | null;
    firmwareType?: FirmwareType;
    color?: string;
    status: DeviceStatus;
    mode: DeviceMode;
    _state?: DeviceState; // TODO: breaking change in next major release
    state?: DeviceState['staticSessionId'];
    features: PROTO.Features;
    unavailableCapabilities: UnavailableCapabilities;
    availableTranslations: string[];
    authenticityChecks?: {
        firmwareRevision: FirmwareRevisionCheckResult | null;
        firmwareHash: FirmwareHashCheckResult | null;
        // Maybe add AuthenticityCheck result here?
    };
};

export type UnknownDevice = BaseDevice & {
    type: 'unacquired';
    /** @deprecated, use features.label instead */
    label: 'Unacquired device';
    id?: typeof undefined;
    error?: typeof undefined;
    features?: typeof undefined;
    firmware?: typeof undefined;
    firmwareRelease?: typeof undefined;
    firmwareType?: typeof undefined;
    color?: typeof undefined;
    status?: typeof undefined;
    mode?: typeof undefined;
    _state?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
};

export type UnreadableDevice = BaseDevice & {
    type: 'unreadable';
    /** @deprecated, use features.label instead */
    label: 'Unreadable device';
    error: string;
    id?: typeof undefined;
    features?: typeof undefined;
    firmware?: typeof undefined;
    firmwareRelease?: typeof undefined;
    firmwareType?: typeof undefined;
    color?: typeof undefined;
    status?: typeof undefined;
    mode?: typeof undefined;
    _state?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
};

export type Device = KnownDevice | UnknownDevice | UnreadableDevice;
export type Features = PROTO.Features;

export { DeviceModelInternal } from '@trezor/protobuf';

type FeaturesNarrowing =
    | {
          major_version: 2;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: true;
          firmware_present: false;
      }
    | {
          major_version: 2;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: null;
          firmware_present: null;
      }
    | {
          major_version: 2;
          fw_major: 2;
          fw_minor: number;
          fw_patch: number;
          bootloader_mode: true;
          firmware_present: true;
      }
    | {
          major_version: 1;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: true;
          firmware_present: false;
      }
    | {
          major_version: 1;
          fw_major: null;
          fw_minor: null;
          fw_patch: null;
          bootloader_mode: true;
          firmware_present: true;
      };

export type StrictFeatures = Features & FeaturesNarrowing;
