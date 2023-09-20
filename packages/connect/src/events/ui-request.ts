/*
 * messages to UI emitted as UI_EVENT
 */
import type { EventTypeDeviceSelected } from '@trezor/connect-analytics';

import type { PROTO } from '../constants';
import type { TransportDisableWebUSB, TransportRequestWebUSBDevice } from './transport';
import type { Device, CoinInfo, BitcoinNetworkInfo, SelectFeeLevel } from '../types';
import type { DiscoveryAccountType, DiscoveryAccount } from '../types/account';
import type { MessageFactoryFn } from '../types/utils';
import type { DeviceButtonRequest } from './device';

export const UI_EVENT = 'UI_EVENT';
export const UI_REQUEST = {
    TRANSPORT: 'ui-no_transport',
    BOOTLOADER: 'ui-device_bootloader_mode',
    NOT_IN_BOOTLOADER: 'ui-device_not_in_bootloader_mode',
    REQUIRE_MODE: 'ui-device_require_mode',
    INITIALIZE: 'ui-device_not_initialized',
    SEEDLESS: 'ui-device_seedless',
    FIRMWARE_OLD: 'ui-device_firmware_old',
    FIRMWARE_OUTDATED: 'ui-device_firmware_outdated',
    FIRMWARE_NOT_SUPPORTED: 'ui-device_firmware_unsupported',
    FIRMWARE_NOT_COMPATIBLE: 'ui-device_firmware_not_compatible',
    FIRMWARE_NOT_INSTALLED: 'ui-device_firmware_not_installed',
    FIRMWARE_PROGRESS: 'ui-firmware-progress',
    DEVICE_NEEDS_BACKUP: 'ui-device_needs_backup',

    REQUEST_UI_WINDOW: 'ui-request_window',
    CLOSE_UI_WINDOW: 'ui-close_window',

    REQUEST_PERMISSION: 'ui-request_permission',
    REQUEST_CONFIRMATION: 'ui-request_confirmation',
    REQUEST_PIN: 'ui-request_pin',
    INVALID_PIN: 'ui-invalid_pin',
    REQUEST_PASSPHRASE: 'ui-request_passphrase',
    REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
    INVALID_PASSPHRASE: 'ui-invalid_passphrase',
    CONNECT: 'ui-connect',
    LOADING: 'ui-loading',
    SET_OPERATION: 'ui-set_operation',
    SELECT_DEVICE: 'ui-select_device',
    SELECT_ACCOUNT: 'ui-select_account',
    SELECT_FEE: 'ui-select_fee',
    UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
    INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
    REQUEST_BUTTON: 'ui-button',
    REQUEST_WORD: 'ui-request_word',

    LOGIN_CHALLENGE_REQUEST: 'ui-login_challenge_request',
    BUNDLE_PROGRESS: 'ui-bundle_progress',
    ADDRESS_VALIDATION: 'ui-address_validation',
    IFRAME_FAILURE: 'ui-iframe_failure',
} as const;

export type UiRequestWithoutPayload =
    | {
          type: typeof UI_REQUEST.LOADING;
          payload?: typeof undefined;
      }
    | {
          type: typeof UI_REQUEST.REQUEST_UI_WINDOW;
          payload?: typeof undefined;
      }
    | {
          type: typeof UI_REQUEST.IFRAME_FAILURE;
          payload?: typeof undefined;
      }
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
      }
    | {
          type: typeof UI_REQUEST.LOGIN_CHALLENGE_REQUEST;
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
      }
    | {
          type: typeof UI_REQUEST.INVALID_PASSPHRASE;
          payload: {
              device: Device;
              type?: typeof undefined;
          };
      };

export interface UiRequestButtonData {
    type: 'address';
    serializedPath: string;
    address: string;
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

// todo: not used at the moment
export interface UiRequestSetOperation {
    type: typeof UI_REQUEST.SET_OPERATION;
    payload: string;
}

export interface UiRequestPermission {
    type: typeof UI_REQUEST.REQUEST_PERMISSION;
    payload: {
        permissions: string[];
        device: Device;
    };
}

export interface UiRequestConfirmation {
    type: typeof UI_REQUEST.REQUEST_CONFIRMATION;
    payload: {
        view: string;
        label?: string;
        customConfirmButton?: {
            className: string;
            label: string;
        };
        customCancelButton?: {
            className: string;
            label: string;
        };
        analytics?: EventTypeDeviceSelected;
    };
}

export interface UiRequestSelectDevice {
    type: typeof UI_REQUEST.SELECT_DEVICE;
    payload: {
        devices: Device[];
        webusb: boolean;
    };
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
        progress: number;
        response: R;
        error?: string;
    };
}

export interface FirmwareProgress {
    type: typeof UI_REQUEST.FIRMWARE_PROGRESS;
    payload: {
        device: Device;
        progress: number;
    };
}

export type UiEvent =
    | UiRequestWithoutPayload
    | UiRequestDeviceAction
    | UiRequestButton
    | UiRequestPermission
    | UiRequestConfirmation
    | UiRequestSelectDevice
    | UiRequestUnexpectedDeviceMode
    | UiRequestSelectAccount
    | UiRequestSelectFee
    | UpdateCustomFee
    | BundleProgress<any>
    | FirmwareProgress
    | FirmwareException
    | UiRequestAddressValidation
    | UiRequestSetOperation
    | TransportDisableWebUSB
    | TransportRequestWebUSBDevice;

export type UiEventMessage = UiEvent & { event: typeof UI_EVENT };

export type ProgressEventListenerFn = <R>(
    type: typeof UI_REQUEST.BUNDLE_PROGRESS,
    cb: (event: BundleProgress<R>['payload']) => void,
) => void;

export type UiEventListenerFn = (
    type: typeof UI_EVENT,
    cb: (event: UiEventMessage) => void,
) => void;

export const createUiMessage: MessageFactoryFn<typeof UI_EVENT, UiEvent> = (type, payload) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
