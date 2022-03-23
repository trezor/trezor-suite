import { ButtonRequest, PinMatrixRequestType, WordRequestType } from '@trezor/transport';

import { TRANSPORT, UI, IFRAME, POPUP } from './constants';
import { ConnectSettings } from './params';
import { Device } from './trezor/device';
import { DiscoveryAccount, DiscoveryAccountType, SelectFeeLevel } from './account';
import { CoinInfo, BitcoinNetworkInfo } from './networks/coinInfo';

export interface BridgeInfo {
    version: number[];
    directory: string;
    packages: Array<{
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }>;
    changelog: string;
}

export interface UdevInfo {
    directory: string;
    packages: Array<{
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }>;
}

export interface TransportInfo {
    type: string;
    version: string;
    outdated: boolean;
    bridge?: BridgeInfo;
    udev?: UdevInfo;
}

export type TransportEvent =
    | {
          type: typeof TRANSPORT.START;
          payload: TransportInfo;
      }
    | {
          type: typeof TRANSPORT.ERROR;
          payload: {
              error: string;
              bridge?: BridgeInfo;
              udev?: UdevInfo;
          };
      };

/*
 * messages to UI emitted as UI_EVENT
 */

export interface MessageWithoutPayload {
    type:
        | typeof UI.REQUEST_UI_WINDOW
        | typeof POPUP.CANCEL_POPUP_REQUEST
        | typeof POPUP.LOADED
        | typeof UI.TRANSPORT
        | typeof UI.CHANGE_ACCOUNT
        | typeof UI.INSUFFICIENT_FUNDS
        | typeof UI.CLOSE_UI_WINDOW
        | typeof UI.LOGIN_CHALLENGE_REQUEST;
    payload?: typeof undefined;
}

export type DeviceMessage =
    | {
          type: typeof UI.REQUEST_PIN;
          payload: {
              device: Device;
              type: PinMatrixRequestType;
          };
      }
    | {
          type: typeof UI.REQUEST_WORD;
          payload: {
              device: Device;
              type: WordRequestType;
          };
      }
    | {
          type:
              | typeof UI.INVALID_PIN
              | typeof UI.REQUEST_PASSPHRASE_ON_DEVICE
              | typeof UI.REQUEST_PASSPHRASE
              | typeof UI.INVALID_PASSPHRASE;
          payload: {
              device: Device;
              type?: typeof undefined;
          };
      };

export interface ButtonRequestData {
    type: 'address';
    serializedPath: string;
    address: string;
}

// ButtonRequest_FirmwareUpdate is a artificial button request thrown by "uploadFirmware" method
// at the beginning of the uploading process
export interface ButtonRequestMessage {
    type: typeof UI.REQUEST_BUTTON;
    payload: Omit<ButtonRequest, 'code'> & {
        code?: ButtonRequest['code'] | 'ButtonRequest_FirmwareUpdate';
        device: Device;
        data?: ButtonRequestData;
    };
}

export interface AddressValidationMessage {
    type: typeof UI.ADDRESS_VALIDATION;
    payload?: ButtonRequestData;
}

export interface IFrameError {
    type: typeof IFRAME.ERROR;
    payload: {
        error: string;
        code?: string;
    };
}

export type IFrameLoaded = {
    type: typeof IFRAME.LOADED;
    payload: {
        useBroadcastChannel: boolean;
    };
};

export interface PopupInit {
    type: typeof POPUP.INIT;
    payload: {
        settings: ConnectSettings; // those are settings from window.opener
        useBroadcastChannel: boolean;
    };
}

export interface PopupError {
    type: typeof POPUP.ERROR;
    payload: {
        error: string;
    };
}

export interface PopupHandshake {
    type: typeof POPUP.HANDSHAKE;
    payload?: {
        settings: ConnectSettings; // those are settings from the iframe, they could be different from window.opener settings
        method?: string;
        transport?: TransportInfo;
    };
}

export interface RequestPermission {
    type: typeof UI.REQUEST_PERMISSION;
    payload: {
        permissions: string[];
        device: Device;
    };
}

export interface RequestConfirmation {
    type: typeof UI.REQUEST_CONFIRMATION;
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
    };
}

export interface SelectDevice {
    type: typeof UI.SELECT_DEVICE;
    payload: {
        devices: Device[];
        webusb: boolean;
    };
}

export interface UnexpectedDeviceMode {
    type:
        | typeof UI.BOOTLOADER
        | typeof UI.NOT_IN_BOOTLOADER
        | typeof UI.INITIALIZE
        | typeof UI.SEEDLESS
        | typeof UI.DEVICE_NEEDS_BACKUP;
    payload: Device;
}

export interface FirmwareException {
    type:
        | typeof UI.FIRMWARE_OLD
        | typeof UI.FIRMWARE_OUTDATED
        | typeof UI.FIRMWARE_NOT_SUPPORTED
        | typeof UI.FIRMWARE_NOT_COMPATIBLE
        | typeof UI.FIRMWARE_NOT_INSTALLED;
    payload: Device;
}

export interface SelectAccount {
    type: typeof UI.SELECT_ACCOUNT;
    payload: {
        type: 'start' | 'progress' | 'end';
        coinInfo: CoinInfo;
        accountTypes?: DiscoveryAccountType[];
        defaultAccountType?: DiscoveryAccountType;
        accounts?: DiscoveryAccount[];
        preventEmpty?: boolean;
    };
}

export interface SelectFee {
    type: typeof UI.SELECT_FEE;
    payload: {
        coinInfo: BitcoinNetworkInfo;
        feeLevels: SelectFeeLevel[];
    };
}

export interface UpdateCustomFee {
    type: typeof UI.UPDATE_CUSTOM_FEE;
    payload: {
        coinInfo: BitcoinNetworkInfo;
        feeLevels: SelectFeeLevel[];
    };
}

export interface BundleProgress<R> {
    type: typeof UI.BUNDLE_PROGRESS;
    payload: {
        progress: number;
        response: R;
        error?: string;
    };
}

export interface FirmwareProgress {
    type: typeof UI.FIRMWARE_PROGRESS;
    payload: {
        device: Device;
        progress: number;
    };
}

/*
 * Callback message for CustomMessage method
 */
export interface CustomMessageRequest {
    type: typeof UI.CUSTOM_MESSAGE_REQUEST;
    payload: {
        type: string;
        message: object;
    };
}

export type UiEvent =
    | MessageWithoutPayload
    | DeviceMessage
    | ButtonRequestMessage
    | PopupHandshake
    | RequestPermission
    | RequestConfirmation
    | SelectDevice
    | UnexpectedDeviceMode
    | SelectAccount
    | SelectFee
    | UpdateCustomFee
    | BundleProgress<any>
    | FirmwareProgress
    | CustomMessageRequest;

export interface ReceivePermission {
    type: typeof UI.RECEIVE_PERMISSION;
    payload: {
        granted: boolean;
        remember: boolean;
    };
}

export interface ReceiveConfirmation {
    type: typeof UI.RECEIVE_CONFIRMATION;
    payload: boolean;
}

export interface ReceiveDevice {
    type: typeof UI.RECEIVE_DEVICE;
    payload: {
        device: Device;
        remember: boolean;
    };
}

export interface ReceivePin {
    type: typeof UI.RECEIVE_PIN;
    payload: string;
}

export interface ReceiveWord {
    type: typeof UI.RECEIVE_WORD;
    payload: string;
}

export interface ReceivePassphrase {
    type: typeof UI.RECEIVE_PASSPHRASE;
    payload: {
        save: boolean;
        value: string;
        passphraseOnDevice?: boolean;
    };
}

export interface ReceivePassphraseAction {
    type: typeof UI.INVALID_PASSPHRASE_ACTION;
    payload: boolean;
}

export interface ReceiveAccount {
    type: typeof UI.RECEIVE_ACCOUNT;
    payload?: number;
}

export interface ReceiveFee {
    type: typeof UI.RECEIVE_FEE;
    payload:
        | {
              type: 'compose-custom';
              value: number;
          }
        | {
              type: 'change-account';
          }
        | {
              type: 'send';
              value: string;
          };
}

export type UiResponse =
    | ReceivePermission
    | ReceiveConfirmation
    | ReceiveDevice
    | ReceivePin
    | ReceiveWord
    | ReceivePassphrase
    | ReceivePassphraseAction
    | ReceiveAccount
    | ReceiveFee
    | CustomMessageRequest;
