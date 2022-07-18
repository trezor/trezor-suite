import {
    DeviceButtonRequest,
    DeviceEvent,
    KnownDevice,
    PROTO,
    UI,
    UnknownDevice as UnknownDeviceBase,
    UnreadableDevice as UnreadableDeviceBase,
} from '@trezor/connect';
import { DeviceMetadata } from '@suite-common/metadata-types';

// actionBlockerMiddleware serves one purpose only, to block certain actions based on activated device's processMode.
// processMode is set via suiteActions.setProcessMode func

// TODO former type was from suite Action['type'][] - check this if correct
const blockedActions: string[] = [UI.CLOSE_UI_WINDOW];

// definition of blocked actions for each process mode
export const PROCESS_MODE = {
    'confirm-addr': {
        blockedActions, // prevents closing the modal after user confirms the address on a device (Receive tab)
    },
    'sign-tx': {
        blockedActions, // prevents closing the modal between sign and push process
    },
};

// Extend original ButtonRequestMessage from @trezor/connect
// suite (deviceReducer) stores them in slightly different shape:
// - device field from @trezor/connect is excluded
// - code field (ButtonRequestType) is extended/combined with PinMatrixRequestType and WordRequestType (from DeviceMessage)
// - code field also uses two custom ButtonRequests - 'ui-request_pin' and 'ui-invalid_pin' (TODO: it shouldn't)

// TODO: Suite should not define its own type for ButtonRequest. There should be
// sufficient type exported from @trezor/connect;

export type ButtonRequest = Omit<DeviceEvent['payload'], 'device' | 'code'> & {
    code?:
        | 'ui-request_pin'
        | 'ui-invalid_pin'
        | DeviceButtonRequest['payload']['code']
        | NonNullable<PROTO.PinMatrixRequest>['type'];
};

export interface ExtendedDevice {
    useEmptyPassphrase: boolean;
    passphraseOnDevice?: boolean;
    remember?: boolean; // device should be remembered
    forceRemember?: true; // device was forced to be remembered
    connected: boolean; // device is connected
    available: boolean; // device cannot be used because of features.passphrase_protection is different then expected
    authConfirm?: boolean; // device cannot be used because passphrase was not confirmed
    authFailed?: boolean; // device cannot be used because authorization process failed
    instance?: number;
    ts: number;
    buttonRequests: ButtonRequest[];
    metadata: DeviceMetadata;
    processMode?: keyof typeof PROCESS_MODE;
    walletNumber?: number; // number of hidden wallet intended to be used in UI
    reconnectRequested?: boolean; // currently only after wipeDevice
}

export type AcquiredDevice = KnownDevice & ExtendedDevice;

export type UnknownDevice = UnknownDeviceBase & ExtendedDevice;

export type UnreadableDevice = UnreadableDeviceBase & ExtendedDevice;

export type TrezorDevice = AcquiredDevice | UnknownDevice | UnreadableDevice;
