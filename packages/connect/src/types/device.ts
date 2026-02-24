import { FeaturesNarrowing, FirmwareType } from '@trezor/device-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { ThpStateSerialized } from '@trezor/protocol';
import { Descriptor } from '@trezor/transport';
import { Branded } from '@trezor/type-utils';

import type { FirmwareReleaseConfigInfo } from './firmware';

/**
 * - `busy`               application has an active session but device is currently unresponsive (example: connect to host device screen after RebootToBootloader)
 * - `bootloader-locked`  from push-notification. device is either restarting or was rebooted to bootloader and waiting for confirmation
 * - `rebooting`          from push-notification. device is booting to normal mode
 * - `hard-locked`        from push-notification. device won't accept messages. eg., cancel bootloader mode
 * - `pin-locked`         device responded with specific THP error
 * - `thp-locked`         device is waiting for THP pairing
 */
export type DeviceBusyStatus =
    | 'busy'
    | 'rebooting'
    | 'bootloader-locked'
    | 'hard-locked'
    | 'pin-locked'
    | 'thp-locked';

/**
 * - `available`  no other application has an active session
 * - `occupied`   other application has an active session
 * - `used`       another has released the device and no other application has an active session
 */
export type DeviceStatus = 'available' | 'occupied' | 'used' | DeviceBusyStatus;

export type DeviceMode =
    | 'normal'
    | 'bootloader'

    /**
     * Device has not yet been set up. It has no secret inside.
     * It must be either recovered from seed or newly generated
     */
    | 'initialize'

    /**
     * Seedless setup for Multi-sig. Not supported by Suite.
     *
     * @see: https://trezor.io/guides/backups-recovery/advanced-wallets/seedless-setup
     */
    | 'seedless';

export type DeviceFirmwareStatus =
    | 'valid'
    | 'outdated'
    | 'required'
    | 'unknown'
    | 'custom'
    | 'none';

export type UnavailableCapability =
    | 'no-capability' // flag missing, could mean it's outdated or BTC only
    | 'no-support' // not supported on this Trezor model at all
    | 'update-required'
    | 'trezor-connect-outdated';

/**
 * This is ID assigned to Device object at point where it first interacts
 * with the Wallet (passphrase or standard).
 *
 * Format: `{first testnet address}@{device.features.device_id}:{device.instance}`
 */
export type StaticSessionId = `${string}@${string}:${number}`;

export type DeviceState = {
    sessionId?: string; // dynamic value: Features.session_id
    // ${first testnet address}@${device.features.device_id}:${device.instance}
    staticSessionId?: StaticSessionId;
    deriveCardano?: boolean;
};

export type DeviceThpState = {
    properties?: ThpStateSerialized['properties'];
    credentials: ThpStateSerialized['credentials'];
    channel: string;
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
          errorPayload?: unknown;
      };

export type FirmwareHashCheckError =
    | 'hash-mismatch'
    | 'check-skipped'
    | 'check-unsupported'
    | 'unknown-release'
    | 'takes-too-long'
    | 'other-error';

export type FirmwareHashCheckResult =
    | { success: true; attemptCount?: number; warningPayload?: unknown }
    | {
          success: false;
          error: FirmwareHashCheckError;
          attemptCount?: number;
          errorPayload?: unknown;
      };

export type XPubHashesPerBip43Path = Record<string, string>;
export type EntropyCheckResult = { success: boolean; xpubHashes?: XPubHashesPerBip43Path };

/**
 * The Unique Device Identifier per Suite run & Connected Device.
 * When Suite is restarted or the Device is reconnected this will change.
 *
 * The main reason for this identifier is to reference device which is unacquired
 * and therefore has no `id` yet. Typical use case is THP pairing
 */
export type DeviceUniquePath = string & Branded<'DeviceUniquePath'>;
export const asDeviceUniquePath = (id: string) => id as DeviceUniquePath;

type BaseDevice = {
    path: DeviceUniquePath;
    name: string;
    descriptor: Pick<Descriptor, 'apiType' | 'id'>;
};

export type BluetoothDeviceId = string & Branded<'BluetoothDeviceId'>;
export const asBluetoothDeviceId = (id: string) => id as BluetoothDeviceId;

export type BluetoothDeviceProps = {
    id: BluetoothDeviceId;
};

export type KnownDevice = BaseDevice & {
    type: 'acquired';

    /**
     * Identifier of the PHYSICAL device. It is part of the device.features
     * so it is known only fo `AcquiredDevice`. The `id` will change in case of Wipe Device.
     *
     * Example: F06CBD5EB27720C19FD01A0D
     *
     * Note: despite this is nullable, Acquired device shall always have it.
     */
    id: string | null;

    /** @deprecated, use features.label instead */
    label: string;
    error?: typeof undefined;
    firmware: DeviceFirmwareStatus;
    firmwareReleaseConfigInfo?: FirmwareReleaseConfigInfo | null;
    firmwareType?: FirmwareType;
    color?: string;
    status: DeviceStatus;
    mode: DeviceMode;
    state?: DeviceState;
    features: PROTO.Features;
    thp?: DeviceThpState;
    unavailableCapabilities: UnavailableCapabilities;
    availableTranslations: Record<string, string>;
    authenticityChecks: {
        firmwareRevision: FirmwareRevisionCheckResult | null;
        firmwareHash: FirmwareHashCheckResult | null;
        // Maybe add AuthenticityCheck result here?
    };
    transportSessionOwner?: undefined;
    hid?: undefined;
    /** @deprecated  use descriptor.id in combination with descriptor.apiType */
    bluetoothProps?: BluetoothDeviceProps;
    usb_connected?: boolean; // true if the device is powered/charged from USB, regardless of transport selection.
    wireless_connected?: boolean;
};

export type UnknownDevice = BaseDevice & {
    type: 'unacquired';
    /** @deprecated, use features.label instead */
    label: 'Unacquired device';
    id?: typeof undefined;
    error?: typeof undefined;
    features?: typeof undefined;
    thp?: DeviceThpState;
    firmware?: typeof undefined;
    firmwareReleaseConfigInfo?: typeof undefined;
    firmwareType?: typeof undefined;
    color?: typeof undefined;
    status?: DeviceStatus;
    mode?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
    transportSessionOwner?: string;
    hid?: undefined;
    /** @deprecated  use descriptor.id in combination with descriptor.apiType */
    bluetoothProps?: BluetoothDeviceProps;
};

export type UnreadableDevice = BaseDevice & {
    type: 'unreadable';
    /** @deprecated, use features.label instead */
    label: 'Unreadable device';
    error: string;
    id?: typeof undefined;
    features?: typeof undefined;
    thp?: typeof undefined;
    firmware?: typeof undefined;
    firmwareReleaseConfigInfo?: typeof undefined;
    firmwareType?: typeof undefined;
    color?: typeof undefined;
    status?: typeof undefined;
    mode?: typeof undefined;
    state?: typeof undefined;
    unavailableCapabilities?: typeof undefined;
    availableTranslations?: typeof undefined;
    transportSessionOwner?: undefined;
    hid: boolean;
    /** @deprecated  use descriptor.id in combination with descriptor.apiType */
    bluetoothProps?: typeof undefined;
};

export type Device = KnownDevice | UnknownDevice | UnreadableDevice;
export type Features = PROTO.Features;

export type DisplayRotation = PROTO.DisplayRotation;

export type StrictFeatures = Features & FeaturesNarrowing;

/** Hex */
export type ProofOfDelegatedIdentity = string & Branded<'ProofOfDelegatedIdentity'>;

export const asProofOfDelegatedIdentity = (value: string): ProofOfDelegatedIdentity =>
    value as ProofOfDelegatedIdentity;
