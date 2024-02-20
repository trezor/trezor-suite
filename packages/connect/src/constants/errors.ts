export const ERROR_CODES = {
    Init_NotInitialized: 'TrezorConnect not initialized', // race condition: call on not initialized Core (usually hot-reloading)
    Init_AlreadyInitialized: 'TrezorConnect has been already initialized', // thrown by .init called multiple times
    Init_IframeBlocked: 'Iframe blocked', // iframe injection blocked (ad-blocker)
    Init_IframeTimeout: 'Iframe timeout', // iframe didn't load in specified time
    Init_ManifestMissing:
        'Manifest not set. Read more at https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md', // manifest is not set

    Popup_ConnectionMissing: 'Unable to establish connection with iframe', // thrown by popup

    Transport_Missing: 'Transport is missing', // no transport available
    Transport_InvalidProtobuf: '', // generic error from transport layer (trezor-link)

    Method_InvalidPackage:
        'This package is not suitable to work with browser. Use @trezor/connect-web package instead', // thrown by node and react-native env while using regular 'web' package
    Method_InvalidParameter: '', // replaced by generic text
    Method_NotAllowed: 'Method not allowed for this configuration', // example: device management in popup mode
    Method_PermissionsNotGranted: 'Permissions not granted', // permission/confirmation not granted in popup
    Method_Cancel: 'Cancelled', // permission/confirmation not granted in popup OR .cancel() custom error
    Method_Interrupted: 'Popup closed', // interruption: popup closed
    Method_UnknownCoin: 'Coin not found', // coin definition not found
    Method_AddressNotMatch: 'Addresses do not match', // thrown by all getAddress methods with custom UI validation
    Method_FirmwareUpdate_DownloadFailed: 'Failed to download firmware binary', // thrown by FirmwareUpdate method
    Method_Discovery_BundleException: '', // thrown by getAccountInfo method
    Method_Override: 'override', // inner "error", it's more like a interruption
    Method_NoResponse: 'Call resolved without response', // thrown by npm index(es), call to Core resolved without response, should not happen

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
};

export class TrezorError extends Error {
    code: string;

    message: string;

    constructor(code: string, message: string) {
        super(message);
        this.code = code;
        this.message = message;
    }
}

export const TypedError = (id: keyof typeof ERROR_CODES, message?: string) =>
    new TrezorError(id, message || ERROR_CODES[id]);

// serialize Error/TypeError object into payload error type (Error object/class is converted to string while sent via postMessage)
export const serializeError = (payload: any) => {
    if (payload && payload.error instanceof Error) {
        return { error: payload.error.message, code: payload.error.code };
    }

    return payload;
};

// trezord error prefix.
// user has insufficient permissions. may occur in Linux (missing udev rules), Windows and MacOS.
export const LIBUSB_ERROR_MESSAGE = 'LIBUSB_ERROR';
