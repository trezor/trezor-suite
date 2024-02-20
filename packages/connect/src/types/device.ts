import type { PROTO } from '../constants';
import type { ReleaseInfo } from './firmware';

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

// NOTE: unavailableCapabilities is an object with information what is NOT supported by this device.
// in ideal/expected setup this object should be empty but given setup might have exceptions.
// key = coin shortcut lowercase (ex: btc, eth, xrp) OR field declared in coins.json "supportedFirmware.capability"
export type UnavailableCapabilities = { [key: string]: UnavailableCapability };

export type KnownDevice = {
    type: 'acquired';
    id: string | null;
    path: string;
    label: string;
    error?: typeof undefined;
    firmware: DeviceFirmwareStatus;
    firmwareRelease?: ReleaseInfo | null;
    firmwareType?: FirmwareType;
    name: string;
    color?: string;
    status: DeviceStatus;
    mode: DeviceMode;
    state?: string;
    features: PROTO.Features;
    unavailableCapabilities: UnavailableCapabilities;
    availableTranslations: string[];
};

export type UnknownDevice = {
    type: 'unacquired';
    id?: null;
    path: string;
    label: string;
    error?: typeof undefined;
    features?: typeof undefined;
    firmware?: typeof undefined;
    firmwareRelease?: typeof undefined;
    firmwareType?: typeof undefined;
    name: string;
    color?: typeof undefined;
    status?: typeof undefined;
    mode?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
};

export type UnreadableDevice = {
    type: 'unreadable';
    id?: null;
    path: string;
    label: string;
    error: string;
    features?: typeof undefined;
    firmware?: typeof undefined;
    firmwareRelease?: typeof undefined;
    firmwareType?: typeof undefined;
    name: string;
    color?: typeof undefined;
    status?: typeof undefined;
    mode?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
};

export type Device = KnownDevice | UnknownDevice | UnreadableDevice;
export type Features = PROTO.Features;
export { DeviceModelInternal } from '@trezor/protobuf/lib/messages-schema';

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
