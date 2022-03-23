export const CORE_EVENT = 'CORE_EVENT';
export const UI_EVENT = 'UI_EVENT';
export const DEVICE_EVENT = 'DEVICE_EVENT';
export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
export const RESPONSE_EVENT = 'RESPONSE_EVENT';
export const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';

export namespace BLOCKCHAIN {
    const CONNECT = 'blockchain-connect';
    const ERROR = 'blockchain-error';
    const NOTIFICATION = 'blockchain-notification';
    const BLOCK = 'blockchain-block';
    const FIAT_RATES_UPDATE = 'fiat-rates-update';
}

export namespace IFRAME {
    const BOOTSTRAP = 'iframe-bootstrap';
    const LOADED = 'iframe-loaded';
    const INIT = 'iframe-init';
    const ERROR = 'iframe-error';
    const CALL = 'iframe-call';
}

export namespace POPUP {
    // Message called from popup.html inline script before "window.onload" event. This is first message from popup to window.opener.
    const BOOTSTRAP = 'popup-bootstrap';
    // Message from popup.js to window.opener, called after "window.onload" event. This is second message from popup to window.opener.
    const LOADED = 'popup-loaded';
    // Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.
    const INIT = 'popup-init';
    // Error message from popup to window.opener. Could be thrown during popup initialization process (POPUP.INIT)
    const ERROR = 'popup-error';
    // Message to webextensions, opens "trezor-usb-permission.html" within webextension
    const EXTENSION_USB_PERMISSIONS = 'open-usb-permissions';
    // Message called from both [popup > iframe] then [iframe > popup] in this exact order.
    // Firstly popup call iframe to resolve popup promise in Core
    // Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup
    const HANDSHAKE = 'popup-handshake';
    // Event emitted from PopupManager at the end of popup closing process.
    // Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available
    const CLOSED = 'popup-closed';
    // Message called from iframe to popup, it means that popup will not be needed (example: Blockchain methods are not using popup at all)
    // This will close active popup window and/or clear opening process in PopupManager (maybe popup wasn't opened yet)
    const CANCEL_POPUP_REQUEST = 'ui-cancel-popup-request';
    // Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event
    const CLOSE_WINDOW = 'window.close';
}

export namespace TRANSPORT {
    const START = 'transport-start';
    const ERROR = 'transport-error';
    const UPDATE = 'transport-update';
    const STREAM = 'transport-stream';
    const REQUEST = 'transport-request_device';
    const RECONNECT = 'transport-reconnect';
    const DISABLE_WEBUSB = 'transport-disable_webusb';
    const START_PENDING = 'transport-start_pending';
}

export namespace DEVICE {
    // device list events
    const CONNECT = 'device-connect';
    const CONNECT_UNACQUIRED = 'device-connect_unacquired';
    const DISCONNECT = 'device-disconnect';
    const CHANGED = 'device-changed';
    const ACQUIRE = 'device-acquire';
    const RELEASE = 'device-release';
    const ACQUIRED = 'device-acquired';
    const RELEASED = 'device-released';
    const USED_ELSEWHERE = 'device-used_elsewhere';

    const LOADING = 'device-loading';

    // trezor-link events in protobuf format
    const BUTTON = 'button';
    const PIN = 'pin';
    const PASSPHRASE = 'passphrase';
    const PASSPHRASE_ON_DEVICE = 'passphrase_on_device';
    const WORD = 'word';

    // custom
    const WAIT_FOR_SELECTION = 'device-wait_for_selection';
}

export namespace UI {
    // TRANSPORT is also defined as standalone namespace. plugin bug or invalid syntax?
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const TRANSPORT = 'ui-no_transport';
    const BOOTLOADER = 'ui-device_bootloader_mode';
    const NOT_IN_BOOTLOADER = 'ui-device_not_in_bootloader_mode';
    const REQUIRE_MODE = 'ui-device_require_mode';
    const INITIALIZE = 'ui-device_not_initialized';
    const SEEDLESS = 'ui-device_seedless';
    const FIRMWARE_OLD = 'ui-device_firmware_old';
    const FIRMWARE_OUTDATED = 'ui-device_firmware_outdated';
    const FIRMWARE_NOT_SUPPORTED = 'ui-device_firmware_unsupported';
    const FIRMWARE_NOT_COMPATIBLE = 'ui-device_firmware_not_compatible';
    const FIRMWARE_NOT_INSTALLED = 'ui-device_firmware_not_installed';
    const FIRMWARE_PROGRESS = 'ui-firmware-progress';
    const DEVICE_NEEDS_BACKUP = 'ui-device_needs_backup';

    const REQUEST_UI_WINDOW = 'ui-request_window';
    const CLOSE_UI_WINDOW = 'ui-close_window';

    const REQUEST_PERMISSION = 'ui-request_permission';
    const REQUEST_CONFIRMATION = 'ui-request_confirmation';
    const REQUEST_PIN = 'ui-request_pin';
    const INVALID_PIN = 'ui-invalid_pin';
    const REQUEST_PASSPHRASE = 'ui-request_passphrase';
    const REQUEST_PASSPHRASE_ON_DEVICE = 'ui-request_passphrase_on_device';
    const INVALID_PASSPHRASE = 'ui-invalid_passphrase';
    const INVALID_PASSPHRASE_ACTION = 'ui-invalid_passphrase_action';
    const CONNECT = 'ui-connect';
    const LOADING = 'ui-loading';
    const SET_OPERATION = 'ui-set_operation';
    const SELECT_DEVICE = 'ui-select_device';
    const SELECT_ACCOUNT = 'ui-select_account';
    const SELECT_FEE = 'ui-select_fee';
    const UPDATE_CUSTOM_FEE = 'ui-update_custom_fee';
    const INSUFFICIENT_FUNDS = 'ui-insufficient_funds';
    const REQUEST_BUTTON = 'ui-button';
    const REQUEST_WORD = 'ui-request_word';

    const RECEIVE_PERMISSION = 'ui-receive_permission';
    const RECEIVE_CONFIRMATION = 'ui-receive_confirmation';
    const RECEIVE_PIN = 'ui-receive_pin';
    const RECEIVE_PASSPHRASE = 'ui-receive_passphrase';
    const RECEIVE_DEVICE = 'ui-receive_device';
    const CHANGE_ACCOUNT = 'ui-change_account';
    const RECEIVE_ACCOUNT = 'ui-receive_account';
    const RECEIVE_FEE = 'ui-receive_fee';
    const RECEIVE_WORD = 'ui-receive_word';

    const CHANGE_SETTINGS = 'ui-change_settings';

    const CUSTOM_MESSAGE_REQUEST = 'ui-custom_request';
    const CUSTOM_MESSAGE_RESPONSE = 'ui-custom_response';

    const LOGIN_CHALLENGE_REQUEST = 'ui-login_challenge_request';
    const LOGIN_CHALLENGE_RESPONSE = 'ui-login_challenge_response';

    const BUNDLE_PROGRESS = 'ui-bundle_progress';
    const ADDRESS_VALIDATION = 'ui-address_validation';
}

export namespace CARDANO {
    enum PROTOCOL_MAGICS {
        mainnet = 764824073,
        testnet = 1097911063,
    }

    enum NETWORK_IDS {
        mainnet = 1,
        testnet = 0,
    }

    enum ADDRESS_TYPE {
        Base = 0,
        Pointer = 4,
        Enterprise = 6,
        Byron = 8,
        Reward = 14,
    }

    enum CERTIFICATE_TYPE {
        StakeRegistration = 0,
        StakeDeregistration = 1,
        StakeDelegation = 2,
        StakePoolRegistration = 3,
    }
}
