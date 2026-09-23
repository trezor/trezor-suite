/*
 * messages to UI emitted as UI_EVENT
 */

import type { DeviceModelInternal, FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import { createTypeGuardByType } from '@trezor/type-utils';
import type { VersionArray } from '@trezor/utils';

import type { DeviceButtonRequest } from './device';
import type { Device } from '../types/device';

export const UI_EVENT = 'UI_EVENT';

export const UI_EVENTS = {
    // --- Transport ---

    /** No transport layer (bridge/WebUSB) is available */
    TRANSPORT_MISSING: 'ui-event_transport_missing',

    // --- Device state ---

    /** Device is in bootloader mode (unexpected for the current method) */
    DEVICE_IN_BOOTLOADER: 'ui-event_device_in_bootloader',
    /** Device is NOT in bootloader mode (unexpected for the current method) */
    DEVICE_NOT_IN_BOOTLOADER: 'ui-event_device_not_in_bootloader',
    /** Device has not been initialized (no seed) */
    DEVICE_NOT_INITIALIZED: 'ui-event_device_not_initialized',
    /** Device is in seedless mode */
    DEVICE_SEEDLESS: 'ui-event_device_seedless',
    /** Device has no backup — user should be warned */
    DEVICE_NEEDS_BACKUP: 'ui-event_device_needs_backup',

    // --- Firmware status ---

    /** Installed firmware is older than the minimum required version */
    FIRMWARE_OLD: 'ui-event_firmware_old',
    /** Installed firmware is outdated but still functional */
    FIRMWARE_OUTDATED: 'ui-event_firmware_outdated',
    /** Installed firmware is not supported by the current method */
    FIRMWARE_NOT_SUPPORTED: 'ui-event_firmware_not_supported',
    /** Installed firmware is not compatible with the current method */
    FIRMWARE_NOT_COMPATIBLE: 'ui-event_firmware_not_compatible',
    /** No firmware is installed on the device */
    FIRMWARE_NOT_INSTALLED: 'ui-event_firmware_not_installed',

    // --- Firmware update flow ---

    /** Firmware download/flash progress update */
    FIRMWARE_PROGRESS: 'ui-event_firmware_progress',
    /** Firmware operation is taking unexpectedly long */
    FIRMWARE_PROGRESS_UNEXPECTED_DELAY: 'ui-event_firmware_progress_unexpected_delay',
    /** Firmware type changed (e.g. Universal ↔ Bitcoin-only) */
    FIRMWARE_TYPE_CHANGED: 'ui-event_firmware_type_changed',
    /** Waiting for device to reconnect during firmware installation */
    FIRMWARE_RECONNECT: 'ui-event_firmware_reconnect',
    /**
     * Firmware binary was downloaded. The host may store it locally
     * and respond with RECEIVE_FIRMWARE, but the response is not awaited —
     * the firmware update flow continues regardless.
     */
    FIRMWARE_DOWNLOADED: 'ui-event_firmware_downloaded',

    // --- PIN / Passphrase ---

    /** User entered an invalid PIN */
    PIN_INVALID: 'ui-event_pin_invalid',
    /** All PIN attempts have been exhausted — device is wiped */
    PIN_INVALID_ATTEMPTS_DEPLETED: 'ui-event_pin_invalid_attempts_depleted',
    /** Passphrase is being entered on the device */
    PASSPHRASE_ON_DEVICE: 'ui-event_passphrase_on_device',

    // --- Transaction ---

    /** Account balance is insufficient for the transaction */
    ACCOUNT_INSUFFICIENT_FUNDS: 'ui-event_account_insufficient_funds',

    // --- Device call lifecycle ---

    /**
     * A method that uses the device (`useDevice === true`) started talking to it.
     * The host should lock the device UI until the matching `DEVICE_UNLOCK`.
     */
    DEVICE_LOCK: 'ui-event_device_lock',
    /**
     * A device-using method finished (resolved or rejected). Emitted exactly once
     * per `DEVICE_LOCK`, so the host can pair lock/unlock without a method blocklist.
     */
    DEVICE_UNLOCK: 'ui-event_device_unlock',

    // --- Generic ---

    /** Device is requesting a physical button press confirmation */
    BUTTON_REQUEST: 'ui-event_button_request',
    /** Progress update for bundled (multi-call) operations */
    BUNDLE_PROGRESS: 'ui-event_bundle_progress',
    /** Signal to close the UI popup/modal window */
    CLOSE_UI_WINDOW: 'ui-event_close_ui_window',
} as const;

export type UiEventWithoutPayload =
    | {
          type: typeof UI_EVENTS.TRANSPORT_MISSING;
          payload?: never;
      }
    | {
          type: typeof UI_EVENTS.ACCOUNT_INSUFFICIENT_FUNDS;
          payload?: never;
      }
    | {
          type: typeof UI_EVENTS.CLOSE_UI_WINDOW;
          payload?: never;
      };

// Emitted around a device-using call (useDevice === true). `device` identifies the device the call
// used; it is resolved only once the call has been assigned a device, so it is present on
// DEVICE_UNLOCK and absent on DEVICE_LOCK (and on firmwareUpdate, which resolves the device later).
export interface UiEventDeviceLock {
    type: typeof UI_EVENTS.DEVICE_LOCK | typeof UI_EVENTS.DEVICE_UNLOCK;
    payload: {
        device?: Device;
    };
}

export type UiEventDeviceAction =
    | {
          type: typeof UI_EVENTS.PIN_INVALID;
          payload: {
              device: Device;
              type?: never;
          };
      }
    | {
          type: typeof UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED;
          payload: {
              device: Device;
              type?: never;
          };
      }
    | {
          type: typeof UI_EVENTS.PASSPHRASE_ON_DEVICE;
          payload: {
              device: Device;
              type?: never;
          };
      };

export type UiRequestButtonData =
    | {
          type: 'address';
          serializedPath: string;
          address: string;
      }
    | {
          type: 'message';
          serializedPath: string;
          coin: string;
          message: string;
      };

// ButtonRequest_FirmwareUpdate is a artificial button request thrown by "uploadFirmware" method
// at the beginning of the uploading process
export interface UiEventButtonRequest {
    type: typeof UI_EVENTS.BUTTON_REQUEST;
    payload: DeviceButtonRequest['payload'] & {
        data?: UiRequestButtonData;
    };
}

export type UiEventUnexpectedDeviceMode =
    | { type: typeof UI_EVENTS.DEVICE_IN_BOOTLOADER; payload: { device: Device } }
    | { type: typeof UI_EVENTS.DEVICE_NOT_IN_BOOTLOADER; payload: { device: Device } }
    | { type: typeof UI_EVENTS.DEVICE_NOT_INITIALIZED; payload: { device: Device } }
    | { type: typeof UI_EVENTS.DEVICE_SEEDLESS; payload: { device: Device } }
    | { type: typeof UI_EVENTS.DEVICE_NEEDS_BACKUP; payload: { device: Device } };

export type UiEventFirmwareException =
    | { type: typeof UI_EVENTS.FIRMWARE_OLD; payload: { device: Device } }
    | { type: typeof UI_EVENTS.FIRMWARE_OUTDATED; payload: { device: Device } }
    | { type: typeof UI_EVENTS.FIRMWARE_NOT_SUPPORTED; payload: { device: Device } }
    | { type: typeof UI_EVENTS.FIRMWARE_NOT_COMPATIBLE; payload: { device: Device } }
    | { type: typeof UI_EVENTS.FIRMWARE_NOT_INSTALLED; payload: { device: Device } };

export interface UiEventBundleProgress<R> {
    type: typeof UI_EVENTS.BUNDLE_PROGRESS;
    payload: {
        total: number;
        progress: number;
        response: R;
        error?: string;
    };
}

export interface UiEventFirmwareProgress {
    type: typeof UI_EVENTS.FIRMWARE_PROGRESS;
    payload: {
        device: Device;
        operation: 'downloading' | 'flashing' | 'start-flashing';
        progress: number;
    };
}

export interface UiEventFirmwareProgressUnexpectedDelay {
    type: typeof UI_EVENTS.FIRMWARE_PROGRESS_UNEXPECTED_DELAY;
    payload?: never;
}

export interface UiEventFirmwareTypeChanged {
    type: typeof UI_EVENTS.FIRMWARE_TYPE_CHANGED;
    payload: {
        device: Device;
    };
}

/**
 * Prompt user to reconnect device during firmware installation.
 */
export interface UiEventFirmwareReconnect {
    type: typeof UI_EVENTS.FIRMWARE_RECONNECT;
    payload: {
        device: Device;
        disconnected: boolean;
        method: 'manual' | 'auto' | 'wait';
        target: 'normal' | 'bootloader';
        /** how many times this event was fired. resets when request is satisfied */
        i: number;
    };
}

export type FirmwareStoreEvent = {
    binary: ArrayBuffer;
    binaryVersion: VersionArray;
    internalModel: DeviceModelInternal;
    release: FirmwareRelease | undefined;
    firmwareType: FirmwareType;
    releaseVersion?: number[];
};

export interface UiEventFirmwareDownloaded {
    type: typeof UI_EVENTS.FIRMWARE_DOWNLOADED;
    payload: FirmwareStoreEvent;
}

export type UiEvent =
    | UiEventWithoutPayload
    | UiEventDeviceLock
    | UiEventDeviceAction
    | UiEventButtonRequest
    | UiEventUnexpectedDeviceMode
    | UiEventBundleProgress<any>
    | UiEventFirmwareProgress
    | UiEventFirmwareProgressUnexpectedDelay
    | UiEventFirmwareTypeChanged
    | UiEventFirmwareException
    | UiEventFirmwareReconnect
    | UiEventFirmwareDownloaded;

export type UiEventMessage = UiEvent & {
    event: typeof UI_EVENT;
    callId?: string; // callId is added by connect core/index when the event is emitted, see createSendCoreMessageWithCallId
};

export const isUiEventOfType = createTypeGuardByType<UiEvent>();

export const createUiEventMessage = <T extends UiEvent['type']>(
    type: T,
    ...args: Extract<UiEvent, { type: T }> extends { payload: infer P }
        ? [undefined] extends [P]
            ? [payload?: P]
            : [payload: P]
        : []
) =>
    ({
        event: UI_EVENT,
        type,
        payload: args[0],
    }) as Extract<UiEventMessage, { type: T }>;
