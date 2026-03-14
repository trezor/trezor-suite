/*
 * messages to UI emitted as UI_EVENT
 */
import type { DeviceModelInternal, FirmwareRelease, FirmwareType } from '@trezor/device-utils';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import type { DeviceButtonRequest, DeviceThpPairingPayload } from './device';
import type { DiscoveryAccount, DiscoveryAccountType } from '../types/account';
import type { BitcoinNetworkInfo, CoinInfo } from '../types/coinInfo';
import type { Device } from '../types/device';
import type { SelectFeeLevel } from '../types/fees';
import type { MessageFactoryFn } from '../types/utils';

export const UI_EVENT = 'UI_EVENT';
export const UI_REQUEST = {
    TRANSPORT: 'ui-no_transport',
    BOOTLOADER: 'ui-device_bootloader_mode',
    NOT_IN_BOOTLOADER: 'ui-device_not_in_bootloader_mode',
    INITIALIZE: 'ui-device_not_initialized',
    SEEDLESS: 'ui-device_seedless',
    FIRMWARE_OLD: 'ui-device_firmware_old',
    FIRMWARE_OUTDATED: 'ui-device_firmware_outdated',
    FIRMWARE_NOT_SUPPORTED: 'ui-device_firmware_unsupported',
    FIRMWARE_NOT_COMPATIBLE: 'ui-device_firmware_not_compatible',
    FIRMWARE_NOT_INSTALLED: 'ui-device_firmware_not_installed',
    FIRMWARE_PROGRESS: 'ui-firmware-progress',
    FIRMWARE_PROGRESS_UNEXPECTED_DELAY: 'ui-firmware-progress-unexpected-delay',

    /** connect is waiting for device to be automatically reconnected */
    FIRMWARE_RECONNECT: 'ui-firmware_reconnect',
    FIRMWARE_DISCONNECT: 'ui-firmware_disconnect',

    FIRMWARE_DOWNLOADED: 'ui-firmware_downloaded',

    DEVICE_NEEDS_BACKUP: 'ui-device_needs_backup',

    CLOSE_UI_WINDOW: 'ui-close_window',

    REQUEST_CONFIRMATION: 'ui-request_confirmation',
    REQUEST_PIN: 'ui-request_pin',
    INVALID_PIN: 'ui-invalid_pin',
    INVALID_PIN_ATTEMPTS_DEPLETED: 'ui-invalid_pin_attempts_depleted',
    REQUEST_PASSPHRASE: 'ui-request_passphrase',
    REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
    REQUEST_THP_PAIRING: 'ui-request_thp_pairing',
    SELECT_ACCOUNT: 'ui-select_account',
    SELECT_FEE: 'ui-select_fee',
    UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
    INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
    REQUEST_BUTTON: 'ui-button',
    REQUEST_WORD: 'ui-request_word',

    BUNDLE_PROGRESS: 'ui-bundle_progress',
    ADDRESS_VALIDATION: 'ui-address_validation',
} as const;

export type UiRequestWithoutPayload =
    | {
          type: typeof UI_REQUEST.TRANSPORT;
          payload?: typeof undefined;
      }
    | {
          type: typeof UI_REQUEST.INSUFFICIENT_FUNDS;
          payload?: typeof undefined;
      }
    | {
          type: typeof UI_REQUEST.CLOSE_UI_WINDOW;
          payload?: typeof undefined;
      };

export type UiRequestDeviceAction =
    | {
          type: typeof UI_REQUEST.REQUEST_PIN;
          payload: {
              device: Device;
              type?: PROTO.PinMatrixRequestType;
          };
      }
    | {
          type: typeof UI_REQUEST.REQUEST_WORD;
          payload: {
              device: Device;
              type: PROTO.WordRequestType;
          };
      }
    | {
          type: typeof UI_REQUEST.INVALID_PIN;
          payload: {
              device: Device;
              type?: typeof undefined;
          };
      }
    | {
          type: typeof UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED;
          payload: {
              device: Device;
              type?: typeof undefined;
          };
      }
    | {
          type: typeof UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE;
          payload: {
              device: Device;
              type?: typeof undefined;
          };
      }
    | {
          type: typeof UI_REQUEST.REQUEST_PASSPHRASE;
          payload: {
              device: Device;
              type?: typeof undefined;
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

export interface UiRequestThpPairing {
    type: typeof UI_REQUEST.REQUEST_THP_PAIRING;
    payload: DeviceThpPairingPayload & {
        device: Device;
    };
}

// ButtonRequest_FirmwareUpdate is a artificial button request thrown by "uploadFirmware" method
// at the beginning of the uploading process
export interface UiRequestButton {
    type: typeof UI_REQUEST.REQUEST_BUTTON;
    payload: DeviceButtonRequest['payload'] & {
        data?: UiRequestButtonData;
    };
}

export interface UiRequestAddressValidation {
    type: typeof UI_REQUEST.ADDRESS_VALIDATION;
    payload: UiRequestButtonData | undefined;
}

export interface UiRequestConfirmation {
    type: typeof UI_REQUEST.REQUEST_CONFIRMATION;
    payload: {
        view:
            | 'thp-pairing-start'
            | 'thp-pairing-failed'
            | 'no-backup'
            | 'export-xpub'
            | 'export-address'
            | 'export-account-info'
            | 'device-management';
        label?: string;
        customConfirmButton?: {
            className: string;
            label: string;
        };
        customCancelButton?: {
            className: string;
            label: string;
        };
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

export interface UiRequestFirmwareDownloaded {
    type: typeof UI_REQUEST.FIRMWARE_DOWNLOADED;
    payload: FirmwareStoreEvent;
}

export interface UiRequestUnexpectedDeviceMode {
    type:
        | typeof UI_REQUEST.BOOTLOADER
        | typeof UI_REQUEST.NOT_IN_BOOTLOADER
        | typeof UI_REQUEST.INITIALIZE
        | typeof UI_REQUEST.SEEDLESS
        | typeof UI_REQUEST.DEVICE_NEEDS_BACKUP;
    payload: Device;
}

export interface FirmwareException {
    type:
        | typeof UI_REQUEST.FIRMWARE_OLD
        | typeof UI_REQUEST.FIRMWARE_OUTDATED
        | typeof UI_REQUEST.FIRMWARE_NOT_SUPPORTED
        | typeof UI_REQUEST.FIRMWARE_NOT_COMPATIBLE
        | typeof UI_REQUEST.FIRMWARE_NOT_INSTALLED;
    payload: Device;
}

export interface UiRequestSelectAccount {
    type: typeof UI_REQUEST.SELECT_ACCOUNT;
    payload: {
        type: 'start' | 'progress' | 'end';
        coinInfo: CoinInfo;
        accountTypes?: DiscoveryAccountType[];
        defaultAccountType?: DiscoveryAccountType;
        accounts?: DiscoveryAccount[];
        preventEmpty?: boolean;
    };
}

export interface UiRequestSelectFee {
    type: typeof UI_REQUEST.SELECT_FEE;
    payload: {
        coinInfo: BitcoinNetworkInfo;
        feeLevels: SelectFeeLevel[];
    };
}

export interface UpdateCustomFee {
    type: typeof UI_REQUEST.UPDATE_CUSTOM_FEE;
    payload: {
        coinInfo: BitcoinNetworkInfo;
        feeLevels: SelectFeeLevel[];
    };
}

export interface BundleProgress<R> {
    type: typeof UI_REQUEST.BUNDLE_PROGRESS;
    payload: {
        total: number;
        progress: number;
        response: R;
        error?: string;
    };
}

export interface FirmwareProgress {
    type: typeof UI_REQUEST.FIRMWARE_PROGRESS;
    payload: {
        device: Device;
        operation: 'downloading' | 'flashing' | 'start-flashing';
        progress: number;
    };
}

export interface FirmwareProgressUnexpectedDelay {
    type: typeof UI_REQUEST.FIRMWARE_PROGRESS_UNEXPECTED_DELAY;
    payload: {};
}

/**
 * Prompt user to reconnect device during firmware installation.
 */
export interface FirmwareReconnect {
    type: typeof UI_REQUEST.FIRMWARE_RECONNECT;
    payload: {
        device: Device;
        disconnected: boolean;
        method: 'manual' | 'auto' | 'wait';
        target: 'normal' | 'bootloader';
        /** how many times this event was fired. resets when request is satisfied */
        i: number;
    };
}

export interface FirmwareDisconnect {
    type: typeof UI_REQUEST.FIRMWARE_DISCONNECT;
    payload: {
        device: Device;
    };
}

export type UiEvent =
    | UiRequestWithoutPayload
    | UiRequestDeviceAction
    | UiRequestButton
    | UiRequestConfirmation
    | UiRequestUnexpectedDeviceMode
    | UiRequestSelectAccount
    | UiRequestSelectFee
    | UiRequestThpPairing
    | UpdateCustomFee
    | BundleProgress<any>
    | FirmwareProgress
    | FirmwareProgressUnexpectedDelay
    | FirmwareException
    | FirmwareReconnect
    | FirmwareDisconnect
    | UiRequestAddressValidation
    | UiRequestFirmwareDownloaded;

export type UiEventMessage = UiEvent & { event: typeof UI_EVENT };

export const createUiMessage: MessageFactoryFn<typeof UI_EVENT, UiEvent> = (type, payload) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
