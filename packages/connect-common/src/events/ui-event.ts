/*
 * messages to UI emitted as UI_EVENT
 */

import type { DeviceModelInternal, FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import { createTypeGuardByType } from '@trezor/type-utils';
import type { VersionArray } from '@trezor/utils';

import type { DeviceButtonRequest } from './device';
import type { Device } from '../types/device';
import { type MessageFactoryFn } from '../types/utils';

export const UI_EVENT = 'UI_EVENT';

export const UI_EVENTS = {
    // --- Transport ---

    /** No transport layer (bridge/WebUSB) is available */
    NO_TRANSPORT: 'ui-event_no_transport',

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
    /** Device disconnected during firmware installation */
    FIRMWARE_DISCONNECT: 'ui-event_firmware_disconnect',
    /**
     * Firmware binary was downloaded. The host may store it locally
     * and respond with RECEIVE_FIRMWARE, but the response is not awaited —
     * the firmware update flow continues regardless.
     */
    FIRMWARE_DOWNLOADED: 'ui-event_firmware_downloaded',

    // --- PIN / Passphrase ---

    /** User entered an invalid PIN */
    INVALID_PIN: 'ui-event_invalid_pin',
    /** All PIN attempts have been exhausted — device is wiped */
    INVALID_PIN_ATTEMPTS_DEPLETED: 'ui-event_invalid_pin_attempts_depleted',
    /** Passphrase is being entered on the device */
    PASSPHRASE_ON_DEVICE: 'ui-event_passphrase_on_device',

    // --- Transaction ---

    /** Account balance is insufficient for the transaction */
    INSUFFICIENT_FUNDS: 'ui-event_insufficient_funds',

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
          type: typeof UI_EVENTS.NO_TRANSPORT;
          payload?: never;
      }
    | {
          type: typeof UI_EVENTS.INSUFFICIENT_FUNDS;
          payload?: never;
      }
    | {
          type: typeof UI_EVENTS.CLOSE_UI_WINDOW;
          payload?: never;
      };

export type UiEventDeviceAction =
    | {
          type: typeof UI_EVENTS.INVALID_PIN;
          payload: {
              device: Device;
              type?: never;
          };
      }
    | {
          type: typeof UI_EVENTS.INVALID_PIN_ATTEMPTS_DEPLETED;
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

export interface UiEventUnexpectedDeviceMode {
    type:
        | typeof UI_EVENTS.DEVICE_IN_BOOTLOADER
        | typeof UI_EVENTS.DEVICE_NOT_IN_BOOTLOADER
        | typeof UI_EVENTS.DEVICE_NOT_INITIALIZED
        | typeof UI_EVENTS.DEVICE_SEEDLESS
        | typeof UI_EVENTS.DEVICE_NEEDS_BACKUP;
    payload: {
        device: Device;
    };
}

export interface UiEventFirmwareException {
    type:
        | typeof UI_EVENTS.FIRMWARE_OLD
        | typeof UI_EVENTS.FIRMWARE_OUTDATED
        | typeof UI_EVENTS.FIRMWARE_NOT_SUPPORTED
        | typeof UI_EVENTS.FIRMWARE_NOT_COMPATIBLE
        | typeof UI_EVENTS.FIRMWARE_NOT_INSTALLED;
    payload: {
        device: Device;
    };
}

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
    payload: Record<string, never>;
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

export interface UiEventFirmwareDisconnect {
    type: typeof UI_EVENTS.FIRMWARE_DISCONNECT;
    payload: {
        device: Device;
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
    | UiEventDeviceAction
    | UiEventButtonRequest
    | UiEventUnexpectedDeviceMode
    | UiEventBundleProgress<any>
    | UiEventFirmwareProgress
    | UiEventFirmwareProgressUnexpectedDelay
    | UiEventFirmwareTypeChanged
    | UiEventFirmwareException
    | UiEventFirmwareReconnect
    | UiEventFirmwareDisconnect
    | UiEventFirmwareDownloaded;

export type UiEventMessage = UiEvent & {
    event: typeof UI_EVENT;
    requestId?: string;
    callId?: string;
};

export const isUiEventOfType = createTypeGuardByType<UiEvent>();

// type CreateUiMessageOptions = {
//     requestId?: string;
//     callId?: string;
// };

export const createUiEventMessage = ((
    type: UiEvent['type'],
    payload?: UiEvent extends { payload: infer P } ? P : undefined,
    options?: { requestId?: string; callId?: string },
) => {
    const { requestId, callId } = options ?? {};

    return {
        event: UI_EVENT,
        type,
        payload,
        requestId,
        callId,
    };
}) as MessageFactoryFn<typeof UI_EVENT, UiEvent>;
