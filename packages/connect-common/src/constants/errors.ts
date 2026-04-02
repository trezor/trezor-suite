import type { FailureType } from '@trezor/protobuf/src/definitions';
import type { thp } from '@trezor/protocol';

export const ERROR_CODES = {
    Init_NotInitialized: 'TrezorConnect not initialized', // race condition: call on not initialized Core (usually hot-reloading)
    Init_AlreadyInitialized: 'TrezorConnect has been already initialized', // thrown by .init called multiple times
    Init_IframeBlocked: 'Iframe blocked', // iframe injection blocked (ad-blocker)
    Init_IframeTimeout: 'Iframe timeout', // iframe didn't load in specified time
    Init_ManifestMissing:
        'Manifest not set. Read more at https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md', // manifest is not set

    Popup_ConnectionMissing: 'Unable to establish connection with iframe', // thrown by popup
    Desktop_ConnectionMissing: 'Unable to establish connection with Suite', // thrown by suite-desktop

    Transport_Missing: 'Transport is missing', // no transport available

    Method_InvalidPackage:
        'This package is not suitable to work with browser. Use @trezor/connect-web package instead', // thrown by node and react-native env while using regular 'web' package
    Method_InvalidParameter: '', // replaced by generic text
    Method_NotAllowed: 'Method not allowed for this configuration', // example: device management in popup mode
    Method_PermissionsNotGranted: 'Permissions not granted', // permission/confirmation not granted in popup
    Method_Cancel: 'Canceled', // permission/confirmation not granted in popup OR .cancel() custom error
    Method_Interrupted: 'Popup closed', // interruption: popup closed
    Method_UnknownCoin: 'Coin not found', // coin definition not found
    Method_AddressNotMatch: 'Addresses do not match', // thrown by all getAddress methods with custom UI validation
    Method_Discovery_BundleException: '', // thrown by getAccountInfo method
    Method_Override: 'override', // inner "error", it's more like a interruption
    Method_NoResponse: 'Call resolved without response', // thrown by npm index(es), call to Core resolved without response, should not happen
    Method_Unsupported: 'Unsupported method', // 3rd party called a method unknown by current version
    Method_DataOverflowModelOne: 'Model One does not support data over 1024 bytes', // happens in SignMessage, EthereumSignMessage and respective VerifyMessage methods

    Backend_NotSupported: 'BlockchainLink settings not found in coins.json', // thrown by methods which using backends, blockchainLink not defined for this coin
    Backend_WorkerMissing: '', // thrown by BlockchainLink class, worker not specified
    Backend_Disconnected: 'Backend disconnected', // thrown by BlockchainLink class
    Backend_Invalid: 'Invalid backend', // thrown by BlockchainLink class, invalid backend (ie: backend for wrong coin set)
    Backend_Error: '', // thrown by BlockchainLink class, generic message from 'blockchain-link'

    Runtime: '', // thrown from several places, this shouldn't ever happen tho

    Device_NotFound: 'Device not found',
    Device_InitializeFailed: '', // generic error from firmware while calling "Initialize" message
    Device_FwException: '', // generic FirmwareException type
    Device_ModeException: '', // generic Device.UnexpectedMode type
    Device_Disconnected: 'Device disconnected', // device disconnected during call
    Device_UsedElsewhere: 'Device is used in another window', // interruption: current session toked by other application
    Device_InvalidState: 'Passphrase is incorrect', // authorization error (device state comparison)
    Device_CallInProgress: 'Device call in progress', // thrown when trying to make another call while current is still running
    Device_MultipleNotSupported: 'Multiple devices are not supported', // thrown by methods which require single device
    Device_MissingCapability: 'Device is missing capability', // thrown by methods which require specific capability
    Device_MissingCapabilityBtcOnly: 'Device is missing capability (BTC only)', // thrown by methods which require specific capability when using BTC only firmware
    Device_ThpPairingTagInvalid: 'Pairing tag mismatch', // thrown by RECEIVE_THP_PAIRING_TAG handler
    Device_ThpStateMissing: 'ThpState missing', // thrown by thp related actions
    Device_ThpPairingMethodsException: 'No common pairing methods', // device doesn't support requested pairing method(s)

    Failure_UnknownCode: 'Unknown error',
    Failure_EntropyCheck: '', // message from verifyEntropy process

    Deeplink_VersionMismatch: 'Not compatible with current version of the app',

    Browser_LocalNetworkPermissionMissing:
        'Local network permission is missing. Please allow local network access in browser settings.',
} as const;

type TypedErrorCode = keyof typeof ERROR_CODES;

export type ErrorCode = TypedErrorCode | FailureType | thp.ThpError['code'];

export class TrezorError extends Error {
    code: ErrorCode;

    message: string;

    constructor(code: ErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
        this.code = code;
        this.message = message;
    }

    // Error.prototype.toString() does not include custom property `code`
    toString() {
        return `${this.name} (code: ${this.code}): ${this.message}`;
    }
}

export const nestError = (cause: Error) =>
    cause instanceof TrezorError
        ? new TrezorError(cause.code, cause.message, { cause })
        : new Error(cause.message, { cause });

export class TransportError extends Error {}

export const TypedError = (id: ErrorCode, message?: string) =>
    new TrezorError(id, message || ERROR_CODES[id as TypedErrorCode] || id);

// serialize Error/TypeError object into payload error type (Error object/class is converted to string while sent via postMessage)
export const serializeError = (payload: any): SerializedError => {
    const error = payload?.error instanceof Error ? payload.error : payload;

    return error instanceof Error
        ? {
              message: error.message,
              code: 'code' in error ? (error.code as ErrorCode) : 'Failure_UnknownCode',
          }
        : { ...payload };
};

export type SerializedError = {
    message: string;
    code: ErrorCode;
};

// trezord error prefix.
// user has insufficient permissions. may occur in Linux (missing udev rules), Windows and MacOS.
export const LIBUSB_ERROR_MESSAGE = 'LIBUSB_ERROR';
