(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
    else if (typeof define === 'function' && define.amd) define([], factory);
    else if (typeof exports === 'object') exports['TrezorConnect'] = factory();
    else root['TrezorConnect'] = factory();
})(self, function () {
    return /******/ (() => {
        // webpackBootstrap
        /******/ 'use strict';
        /******/ var __webpack_modules__ = {
            /***/ '../connect/lib/constants/cardano.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.POOL_RELAY_TYPE =
                    exports.CERTIFICATE_TYPE =
                    exports.ADDRESS_TYPE =
                    exports.NETWORK_IDS =
                    exports.PROTOCOL_MAGICS =
                        void 0;

                const messages_1 = __webpack_require__('../transport/lib/types/messages.js');

                var PROTOCOL_MAGICS;

                (function (PROTOCOL_MAGICS) {
                    PROTOCOL_MAGICS[(PROTOCOL_MAGICS['mainnet'] = 764824073)] = 'mainnet';
                    PROTOCOL_MAGICS[(PROTOCOL_MAGICS['testnet'] = 42)] = 'testnet';
                })((PROTOCOL_MAGICS = exports.PROTOCOL_MAGICS || (exports.PROTOCOL_MAGICS = {})));

                var NETWORK_IDS;

                (function (NETWORK_IDS) {
                    NETWORK_IDS[(NETWORK_IDS['mainnet'] = 1)] = 'mainnet';
                    NETWORK_IDS[(NETWORK_IDS['testnet'] = 0)] = 'testnet';
                })((NETWORK_IDS = exports.NETWORK_IDS || (exports.NETWORK_IDS = {})));

                exports.ADDRESS_TYPE = messages_1.CardanoAddressType;
                exports.CERTIFICATE_TYPE = messages_1.CardanoCertificateType;
                exports.POOL_RELAY_TYPE = messages_1.CardanoPoolRelayType;

                /***/
            },

            /***/ '../connect/lib/constants/errors.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.LIBUSB_ERROR_MESSAGE =
                    exports.WEBUSB_ERROR_MESSAGE =
                    exports.INVALID_PIN_ERROR_MESSAGE =
                    exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE =
                    exports.TypedError =
                    exports.TrezorError =
                    exports.ERROR_CODES =
                        void 0;
                exports.ERROR_CODES = {
                    Init_NotInitialized: 'TrezorConnect not yet initialized',
                    Init_AlreadyInitialized: 'TrezorConnect has been already initialized',
                    Init_IframeBlocked: 'Iframe blocked',
                    Init_IframeTimeout: 'Iframe timeout',
                    Init_ManifestMissing:
                        'Manifest not set. Read more at https://github.com/trezor/connect/blob/develop/docs/index.md',
                    Popup_ConnectionMissing: 'Unable to establish connection with iframe',
                    Transport_Missing: 'Transport is missing',
                    Transport_InvalidProtobuf: '',
                    Method_InvalidPackage:
                        'This version of trezor-connect is not suitable to work without browser. Use trezor-connect@extended package instead',
                    Method_InvalidParameter: '',
                    Method_NotAllowed: 'Method not allowed for this configuration',
                    Method_PermissionsNotGranted: 'Permissions not granted',
                    Method_Cancel: 'Cancelled',
                    Method_Interrupted: 'Popup closed',
                    Method_UnknownCoin: 'Coin not found',
                    Method_AddressNotMatch: 'Addresses do not match',
                    Method_FirmwareUpdate_DownloadFailed: 'Failed to download firmware binary',
                    Method_CustomMessage_Callback: 'Parameter "callback" is not a function',
                    Method_Discovery_BundleException: '',
                    Method_Override: 'override',
                    Method_NoResponse: 'Call resolved without response',
                    Backend_NotSupported: 'BlockchainLink settings not found in coins.json',
                    Backend_WorkerMissing: '',
                    Backend_Disconnected: 'Backend disconnected',
                    Backend_Invalid: 'Invalid backend',
                    Backend_Error: '',
                    Runtime: '',
                    Device_NotFound: 'Device not found',
                    Device_InitializeFailed: '',
                    Device_FwException: '',
                    Device_ModeException: '',
                    Device_Disconnected: 'Device disconnected',
                    Device_UsedElsewhere: 'Device is used in another window',
                    Device_InvalidState: 'Passphrase is incorrect',
                    Device_CallInProgress: 'Device call in progress',
                };

                class TrezorError extends Error {
                    constructor(code, message) {
                        super(message);
                        this.code = code;
                        this.message = message;
                    }
                }

                exports.TrezorError = TrezorError;

                const TypedError = (id, message) =>
                    new TrezorError(id, message || exports.ERROR_CODES[id]);

                exports.TypedError = TypedError;
                exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = 'wrong previous session';
                exports.INVALID_PIN_ERROR_MESSAGE = 'PIN invalid';
                exports.WEBUSB_ERROR_MESSAGE = 'NetworkError: Unable to claim interface.';
                exports.LIBUSB_ERROR_MESSAGE = 'LIBUSB_ERROR';

                /***/
            },

            /***/ '../connect/lib/constants/index.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.CARDANO = exports.NETWORK = exports.ERRORS = void 0;

                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');

                const ERRORS = (0, tslib_1.__importStar)(
                    __webpack_require__('../connect/lib/constants/errors.js'),
                );
                exports.ERRORS = ERRORS;
                const NETWORK = (0, tslib_1.__importStar)(
                    __webpack_require__('../connect/lib/constants/network.js'),
                );
                exports.NETWORK = NETWORK;
                const CARDANO = (0, tslib_1.__importStar)(
                    __webpack_require__('../connect/lib/constants/cardano.js'),
                );
                exports.CARDANO = CARDANO;

                /***/
            },

            /***/ '../connect/lib/constants/network.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.TYPES = void 0;
                exports.TYPES = {
                    bitcoin: 'Bitcoin',
                    ethereum: 'Ethereum',
                    eos: 'Eos',
                    nem: 'NEM',
                    stellar: 'Stellar',
                    cardano: 'Cardano',
                    ripple: 'Ripple',
                    tezos: 'Tezos',
                    binance: 'Binance',
                };

                /***/
            },

            /***/ '../connect/lib/data/ConnectSettings.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.parse =
                    exports.corsValidator =
                    exports.getEnv =
                    exports.DEFAULT_PRIORITY =
                        void 0;
                const VERSION = '8.2.8-beta.3';
                const versionN = VERSION.split('.').map(s => parseInt(s, 10));
                const DIRECTORY = `${versionN[0]}/`;
                const DEFAULT_DOMAIN = `https://connect.trezor.io/${DIRECTORY}`;
                exports.DEFAULT_PRIORITY = 2;
                const initialSettings = {
                    configSrc: './data/config.json',
                    version: VERSION,
                    debug: false,
                    priority: exports.DEFAULT_PRIORITY,
                    trustedHost: false,
                    connectSrc: DEFAULT_DOMAIN,
                    iframeSrc: `${DEFAULT_DOMAIN}iframe.html`,
                    popup: true,
                    popupSrc: `${DEFAULT_DOMAIN}popup.html`,
                    webusbSrc: `${DEFAULT_DOMAIN}webusb.html`,
                    webusb: true,
                    pendingTransportEvent: true,
                    supportedBrowser:
                        typeof navigator !== 'undefined'
                            ? !/Trident|MSIE|Edge/.test(navigator.userAgent)
                            : true,
                    env: 'web',
                    lazyLoad: false,
                    timestamp: new Date().getTime(),
                    interactionTimeout: 600,
                };

                const parseManifest = manifest => {
                    if (!manifest) return;
                    if (typeof manifest.email !== 'string') return;
                    if (typeof manifest.appUrl !== 'string') return;
                    return {
                        email: manifest.email,
                        appUrl: manifest.appUrl,
                    };
                };

                const getEnv = () => {
                    if (
                        typeof chrome !== 'undefined' &&
                        chrome.runtime &&
                        typeof chrome.runtime.onConnect !== 'undefined'
                    ) {
                        return 'webextension';
                    }

                    if (typeof navigator !== 'undefined') {
                        if (
                            typeof navigator.product === 'string' &&
                            navigator.product.toLowerCase() === 'reactnative'
                        ) {
                            return 'react-native';
                        }

                        const userAgent = navigator.userAgent.toLowerCase();

                        if (userAgent.indexOf(' electron/') > -1) {
                            return 'electron';
                        }
                    }

                    return 'web';
                };

                exports.getEnv = getEnv;

                const corsValidator = url => {
                    if (typeof url !== 'string') return;
                    if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*trezor\.io\//)) return url;
                    if (url.match(/^https?:\/\/localhost:[58][0-9]{3}\//)) return url;
                    if (url.match(/^https:\/\/([A-Za-z0-9\-_]+\.)*sldev\.cz\//)) return url;
                    if (
                        url.match(
                            /^https?:\/\/([A-Za-z0-9\-_]+\.)*trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad\.onion\//,
                        )
                    )
                        return url;
                };

                exports.corsValidator = corsValidator;

                const parse = (input = {}) => {
                    const settings = { ...initialSettings };

                    if (Object.prototype.hasOwnProperty.call(input, 'debug')) {
                        if (Array.isArray(input)) {
                        }

                        if (typeof input.debug === 'boolean') {
                            settings.debug = input.debug;
                        } else if (typeof input.debug === 'string') {
                            settings.debug = input.debug === 'true';
                        }
                    }

                    if (typeof input.connectSrc === 'string') {
                        settings.connectSrc = input.connectSrc;
                    }

                    const globalSrc =
                        typeof window !== 'undefined'
                            ? window.__TREZOR_CONNECT_SRC
                            : __webpack_require__.g.__TREZOR_CONNECT_SRC;

                    if (typeof globalSrc === 'string') {
                        settings.connectSrc = (0, exports.corsValidator)(globalSrc);
                        settings.debug = true;
                    }

                    if (
                        typeof window !== 'undefined' &&
                        window.location &&
                        typeof window.location.search === 'string'
                    ) {
                        const vars = window.location.search.split('&');
                        const customUrl = vars.find(v => v.indexOf('trezor-connect-src') >= 0);

                        if (customUrl) {
                            const [, connectSrc] = customUrl.split('=');
                            settings.connectSrc = (0, exports.corsValidator)(
                                decodeURIComponent(connectSrc),
                            );
                            settings.debug = true;
                        }
                    }

                    const src = settings.connectSrc || DEFAULT_DOMAIN;
                    settings.iframeSrc = `${src}iframe.html`;
                    settings.popupSrc = `${src}popup.html`;
                    settings.webusbSrc = `${src}webusb.html`;

                    if (typeof input.transportReconnect === 'boolean') {
                        settings.transportReconnect = input.transportReconnect;
                    }

                    if (typeof input.webusb === 'boolean') {
                        settings.webusb = input.webusb;
                    }

                    if (typeof input.popup === 'boolean') {
                        settings.popup = input.popup;
                    }

                    if (typeof input.lazyLoad === 'boolean') {
                        settings.lazyLoad = input.lazyLoad;
                    }

                    if (typeof input.pendingTransportEvent === 'boolean') {
                        settings.pendingTransportEvent = input.pendingTransportEvent;
                    }

                    if (
                        typeof window !== 'undefined' &&
                        window.location &&
                        window.location.protocol === 'file:'
                    ) {
                        settings.origin = `file://${window.location.pathname}`;
                        settings.webusb = false;
                    }

                    if (typeof input.extension === 'string') {
                        settings.extension = input.extension;
                    }

                    if (typeof input.env === 'string') {
                        settings.env = input.env;
                    } else {
                        settings.env = (0, exports.getEnv)();
                    }

                    if (typeof input.timestamp === 'number') {
                        settings.timestamp = input.timestamp;
                    }

                    if (typeof input.interactionTimeout === 'number') {
                        settings.interactionTimeout = input.interactionTimeout;
                    }

                    if (typeof input.manifest === 'object') {
                        settings.manifest = parseManifest(input.manifest);
                    }

                    return settings;
                };

                exports.parse = parse;

                /***/
            },

            /***/ '../connect/lib/events/blockchain.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.BlockchainMessage = exports.BLOCKCHAIN = exports.BLOCKCHAIN_EVENT = void 0;
                exports.BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';
                exports.BLOCKCHAIN = {
                    CONNECT: 'blockchain-connect',
                    ERROR: 'blockchain-error',
                    BLOCK: 'blockchain-block',
                    NOTIFICATION: 'blockchain-notification',
                    FIAT_RATES_UPDATE: 'fiat-rates-update',
                };

                const BlockchainMessage = (type, payload) => ({
                    event: exports.BLOCKCHAIN_EVENT,
                    type,
                    payload,
                });

                exports.BlockchainMessage = BlockchainMessage;

                /***/
            },

            /***/ '../connect/lib/events/call.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.ResponseMessage = exports.RESPONSE_EVENT = void 0;
                exports.RESPONSE_EVENT = 'RESPONSE_EVENT';

                const ResponseMessage = (id, success, payload = null) => ({
                    event: exports.RESPONSE_EVENT,
                    type: exports.RESPONSE_EVENT,
                    id,
                    success,
                    payload: success
                        ? payload
                        : {
                              error: payload.error.message,
                              code: payload.error.code,
                          },
                });

                exports.ResponseMessage = ResponseMessage;

                /***/
            },

            /***/ '../connect/lib/events/core.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.ErrorMessage = exports.parseMessage = exports.CORE_EVENT = void 0;
                exports.CORE_EVENT = 'CORE_EVENT';

                const parseMessage = messageData => {
                    const message = {
                        event: messageData.event,
                        type: messageData.type,
                        payload: messageData.payload,
                    };

                    if (typeof messageData.id === 'number') {
                        message.id = messageData.id;
                    }

                    if (typeof messageData.success === 'boolean') {
                        message.success = messageData.success;
                    }

                    return message;
                };

                exports.parseMessage = parseMessage;

                const ErrorMessage = error => ({
                    success: false,
                    payload: {
                        error: error.message,
                        code: error.code,
                    },
                });

                exports.ErrorMessage = ErrorMessage;

                /***/
            },

            /***/ '../connect/lib/events/device.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.DeviceMessage = exports.DEVICE = exports.DEVICE_EVENT = void 0;
                exports.DEVICE_EVENT = 'DEVICE_EVENT';
                exports.DEVICE = {
                    CONNECT: 'device-connect',
                    CONNECT_UNACQUIRED: 'device-connect_unacquired',
                    DISCONNECT: 'device-disconnect',
                    CHANGED: 'device-changed',
                    ACQUIRE: 'device-acquire',
                    RELEASE: 'device-release',
                    ACQUIRED: 'device-acquired',
                    RELEASED: 'device-released',
                    USED_ELSEWHERE: 'device-used_elsewhere',
                    LOADING: 'device-loading',
                    BUTTON: 'button',
                    PIN: 'pin',
                    PASSPHRASE: 'passphrase',
                    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
                    WORD: 'word',
                    WAIT_FOR_SELECTION: 'device-wait_for_selection',
                };

                const DeviceMessage = (type, payload) => ({
                    event: exports.DEVICE_EVENT,
                    type,
                    payload,
                });

                exports.DeviceMessage = DeviceMessage;

                /***/
            },

            /***/ '../connect/lib/events/iframe.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.IFrameMessage = exports.IFRAME = void 0;

                const ui_request_1 = __webpack_require__('../connect/lib/events/ui-request.js');

                exports.IFRAME = {
                    BOOTSTRAP: 'iframe-bootstrap',
                    LOADED: 'iframe-loaded',
                    INIT: 'iframe-init',
                    ERROR: 'iframe-error',
                    CALL: 'iframe-call',
                };

                const IFrameMessage = (type, payload) => ({
                    event: ui_request_1.UI_EVENT,
                    type,
                    payload,
                });

                exports.IFrameMessage = IFrameMessage;

                /***/
            },

            /***/ '../connect/lib/events/index.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.UI = void 0;

                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');

                const ui_request_1 = __webpack_require__('../connect/lib/events/ui-request.js');

                const ui_response_1 = __webpack_require__('../connect/lib/events/ui-response.js');

                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/blockchain.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/call.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/core.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/device.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/iframe.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/popup.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/transport.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/ui-promise.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/ui-request.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/ui-response.js'),
                    exports,
                );
                exports.UI = { ...ui_request_1.UI_REQUEST, ...ui_response_1.UI_RESPONSE };

                /***/
            },

            /***/ '../connect/lib/events/popup.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.PopupMessage = exports.POPUP = void 0;

                const ui_request_1 = __webpack_require__('../connect/lib/events/ui-request.js');

                exports.POPUP = {
                    BOOTSTRAP: 'popup-bootstrap',
                    LOADED: 'popup-loaded',
                    INIT: 'popup-init',
                    ERROR: 'popup-error',
                    EXTENSION_USB_PERMISSIONS: 'open-usb-permissions',
                    HANDSHAKE: 'popup-handshake',
                    CLOSED: 'popup-closed',
                    CANCEL_POPUP_REQUEST: 'ui-cancel-popup-request',
                    CLOSE_WINDOW: 'window.close',
                };

                const PopupMessage = (type, payload) => ({
                    event: ui_request_1.UI_EVENT,
                    type,
                    payload,
                });

                exports.PopupMessage = PopupMessage;

                /***/
            },

            /***/ '../connect/lib/events/transport.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.TransportMessage = exports.TRANSPORT = exports.TRANSPORT_EVENT = void 0;
                exports.TRANSPORT_EVENT = 'TRANSPORT_EVENT';
                exports.TRANSPORT = {
                    START: 'transport-start',
                    ERROR: 'transport-error',
                    UPDATE: 'transport-update',
                    STREAM: 'transport-stream',
                    REQUEST: 'transport-request_device',
                    DISABLE_WEBUSB: 'transport-disable_webusb',
                    START_PENDING: 'transport-start_pending',
                };

                const TransportMessage = (type, payload) => ({
                    event: exports.TRANSPORT_EVENT,
                    type,
                    payload: payload.error
                        ? { ...payload, error: payload.error.message, code: payload.error.code }
                        : payload,
                });

                exports.TransportMessage = TransportMessage;

                /***/
            },

            /***/ '../connect/lib/events/ui-promise.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/events/ui-request.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.UiMessage = exports.UI_REQUEST = exports.UI_EVENT = void 0;
                exports.UI_EVENT = 'UI_EVENT';
                exports.UI_REQUEST = {
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
                    CHANGE_ACCOUNT: 'ui-change_account',
                    SELECT_FEE: 'ui-select_fee',
                    UPDATE_CUSTOM_FEE: 'ui-update_custom_fee',
                    INSUFFICIENT_FUNDS: 'ui-insufficient_funds',
                    REQUEST_BUTTON: 'ui-button',
                    REQUEST_WORD: 'ui-request_word',
                    LOGIN_CHALLENGE_REQUEST: 'ui-login_challenge_request',
                    CUSTOM_MESSAGE_REQUEST: 'ui-custom_request',
                    BUNDLE_PROGRESS: 'ui-bundle_progress',
                    ADDRESS_VALIDATION: 'ui-address_validation',
                    IFRAME_FAILURE: 'ui-iframe_failure',
                };

                const UiMessage = (type, payload) => ({
                    event: exports.UI_EVENT,
                    type,
                    payload,
                });

                exports.UiMessage = UiMessage;

                /***/
            },

            /***/ '../connect/lib/events/ui-response.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.UiResponse = exports.UI_RESPONSE = void 0;

                const ui_request_1 = __webpack_require__('../connect/lib/events/ui-request.js');

                exports.UI_RESPONSE = {
                    RECEIVE_PERMISSION: 'ui-receive_permission',
                    RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
                    RECEIVE_PIN: 'ui-receive_pin',
                    RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
                    RECEIVE_DEVICE: 'ui-receive_device',
                    RECEIVE_ACCOUNT: 'ui-receive_account',
                    RECEIVE_FEE: 'ui-receive_fee',
                    RECEIVE_WORD: 'ui-receive_word',
                    INVALID_PASSPHRASE_ACTION: 'ui-invalid_passphrase_action',
                    CHANGE_SETTINGS: 'ui-change_settings',
                    CUSTOM_MESSAGE_RESPONSE: 'ui-custom_response',
                    LOGIN_CHALLENGE_RESPONSE: 'ui-login_challenge_response',
                };

                const UiResponse = (type, payload) => ({
                    event: ui_request_1.UI_EVENT,
                    type,
                    payload,
                });

                exports.UiResponse = UiResponse;

                /***/
            },

            /***/ '../connect/lib/exports.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.ProtobufMessages = void 0;

                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');

                exports.ProtobufMessages = (0, tslib_1.__importStar)(
                    __webpack_require__('../transport/lib/types/messages.js'),
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/constants/index.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/events/index.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/index.js'),
                    exports,
                );

                /***/
            },

            /***/ '../connect/lib/factory.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.factory = void 0;

                const events_1 = __webpack_require__('../connect/lib/events/index.js');

                const factory = ({
                    eventEmitter,
                    manifest,
                    init,
                    call,
                    getSettings,
                    customMessage,
                    requestLogin,
                    uiResponse,
                    renderWebUSBButton,
                    disableWebUSB,
                    cancel,
                    dispose,
                }) => {
                    const api = {
                        manifest,
                        init,
                        getSettings,
                        on: (type, fn) => {
                            eventEmitter.on(type, fn);
                        },
                        off: (type, fn) => {
                            eventEmitter.removeListener(type, fn);
                        },
                        removeAllListeners: type => {
                            eventEmitter.removeAllListeners(type);
                        },
                        uiResponse,
                        blockchainGetAccountBalanceHistory: params =>
                            call({ ...params, method: 'blockchainGetAccountBalanceHistory' }),
                        blockchainGetCurrentFiatRates: params =>
                            call({ ...params, method: 'blockchainGetCurrentFiatRates' }),
                        blockchainGetFiatRatesForTimestamps: params =>
                            call({ ...params, method: 'blockchainGetFiatRatesForTimestamps' }),
                        blockchainDisconnect: params =>
                            call({ ...params, method: 'blockchainDisconnect' }),
                        blockchainEstimateFee: params =>
                            call({ ...params, method: 'blockchainEstimateFee' }),
                        blockchainGetTransactions: params =>
                            call({ ...params, method: 'blockchainGetTransactions' }),
                        blockchainSetCustomBackend: params =>
                            call({ ...params, method: 'blockchainSetCustomBackend' }),
                        blockchainSubscribe: params =>
                            call({ ...params, method: 'blockchainSubscribe' }),
                        blockchainSubscribeFiatRates: params =>
                            call({ ...params, method: 'blockchainSubscribeFiatRates' }),
                        blockchainUnsubscribe: params =>
                            call({ ...params, method: 'blockchainUnsubscribe' }),
                        blockchainUnsubscribeFiatRates: params =>
                            call({ ...params, method: 'blockchainUnsubscribeFiatRates' }),
                        customMessage: params => customMessage(params),
                        requestLogin: params => requestLogin(params),
                        cardanoGetAddress: params =>
                            call({
                                ...params,
                                method: 'cardanoGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        cardanoGetNativeScriptHash: params =>
                            call({ ...params, method: 'cardanoGetNativeScriptHash' }),
                        cardanoGetPublicKey: params =>
                            call({ ...params, method: 'cardanoGetPublicKey' }),
                        cardanoSignTransaction: params =>
                            call({ ...params, method: 'cardanoSignTransaction' }),
                        cipherKeyValue: params => call({ ...params, method: 'cipherKeyValue' }),
                        composeTransaction: params =>
                            call({ ...params, method: 'composeTransaction' }),
                        ethereumGetAddress: params =>
                            call({
                                ...params,
                                method: 'ethereumGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        ethereumGetPublicKey: params =>
                            call({ ...params, method: 'ethereumGetPublicKey' }),
                        ethereumSignMessage: params =>
                            call({ ...params, method: 'ethereumSignMessage' }),
                        ethereumSignTransaction: params =>
                            call({ ...params, method: 'ethereumSignTransaction' }),
                        ethereumSignTypedData: params =>
                            call({ ...params, method: 'ethereumSignTypedData' }),
                        ethereumVerifyMessage: params =>
                            call({ ...params, method: 'ethereumVerifyMessage' }),
                        getAccountInfo: params => call({ ...params, method: 'getAccountInfo' }),
                        getAddress: params =>
                            call({
                                ...params,
                                method: 'getAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        getDeviceState: params => call({ ...params, method: 'getDeviceState' }),
                        getFeatures: params => call({ ...params, method: 'getFeatures' }),
                        getPublicKey: params => call({ ...params, method: 'getPublicKey' }),
                        nemGetAddress: params =>
                            call({
                                ...params,
                                method: 'nemGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        nemSignTransaction: params =>
                            call({ ...params, method: 'nemSignTransaction' }),
                        pushTransaction: params => call({ ...params, method: 'pushTransaction' }),
                        rippleGetAddress: params =>
                            call({
                                ...params,
                                method: 'rippleGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        rippleSignTransaction: params =>
                            call({ ...params, method: 'rippleSignTransaction' }),
                        signMessage: params => call({ ...params, method: 'signMessage' }),
                        signTransaction: params => call({ ...params, method: 'signTransaction' }),
                        stellarGetAddress: params =>
                            call({
                                ...params,
                                method: 'stellarGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        stellarSignTransaction: params =>
                            call({ ...params, method: 'stellarSignTransaction' }),
                        tezosGetAddress: params =>
                            call({
                                ...params,
                                method: 'tezosGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        tezosGetPublicKey: params =>
                            call({ ...params, method: 'tezosGetPublicKey' }),
                        tezosSignTransaction: params =>
                            call({ ...params, method: 'tezosSignTransaction' }),
                        eosGetPublicKey: params => call({ ...params, method: 'eosGetPublicKey' }),
                        eosSignTransaction: params =>
                            call({ ...params, method: 'eosSignTransaction' }),
                        binanceGetAddress: params =>
                            call({
                                ...params,
                                method: 'binanceGetAddress',
                                useEventListener:
                                    eventEmitter.listenerCount(events_1.UI.ADDRESS_VALIDATION) > 0,
                            }),
                        binanceGetPublicKey: params =>
                            call({ ...params, method: 'binanceGetPublicKey' }),
                        binanceSignTransaction: params =>
                            call({ ...params, method: 'binanceSignTransaction' }),
                        verifyMessage: params => call({ ...params, method: 'verifyMessage' }),
                        resetDevice: params => call({ ...params, method: 'resetDevice' }),
                        wipeDevice: params => call({ ...params, method: 'wipeDevice' }),
                        applyFlags: params => call({ ...params, method: 'applyFlags' }),
                        applySettings: params => call({ ...params, method: 'applySettings' }),
                        backupDevice: params => call({ ...params, method: 'backupDevice' }),
                        changePin: params => call({ ...params, method: 'changePin' }),
                        firmwareUpdate: params => call({ ...params, method: 'firmwareUpdate' }),
                        recoveryDevice: params => call({ ...params, method: 'recoveryDevice' }),
                        getCoinInfo: params => call({ ...params, method: 'getCoinInfo' }),
                        rebootToBootloader: params =>
                            call({ ...params, method: 'rebootToBootloader' }),
                        setProxy: params => call({ ...params, method: 'setProxy' }),
                        dispose,
                        cancel,
                        renderWebUSBButton,
                        disableWebUSB,
                    };
                    return api;
                };

                exports.factory = factory;

                /***/
            },

            /***/ '../connect/lib/index-browser.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');

                const factory_1 = __webpack_require__('../connect/lib/factory.js');

                const fallback = () => {
                    throw new Error('Use @trezor/connect-web package');
                };

                const TrezorConnect = (0, factory_1.factory)({
                    eventEmitter: {
                        on: fallback,
                        off: fallback,
                        removeAllListeners: fallback,
                        listenerCount: fallback,
                    },
                    manifest: fallback,
                    init: fallback,
                    call: fallback,
                    getSettings: fallback,
                    customMessage: fallback,
                    requestLogin: fallback,
                    uiResponse: fallback,
                    renderWebUSBButton: fallback,
                    disableWebUSB: fallback,
                    cancel: fallback,
                    dispose: fallback,
                });
                exports['default'] = TrezorConnect;
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/exports.js'),
                    exports,
                );

                /***/
            },

            /***/ '../connect/lib/types/account.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/types/api/index.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/types/coinInfo.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/types/device.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/types/index.js': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');

                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/api/index.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/account.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/coinInfo.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/device.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/params.js'),
                    exports,
                );
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/types/settings.js'),
                    exports,
                );

                /***/
            },

            /***/ '../connect/lib/types/params.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/types/settings.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });

                /***/
            },

            /***/ '../connect/lib/utils/debug.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.getLog =
                    exports.enableLogByPrefix =
                    exports.enableLog =
                    exports.initLog =
                        void 0;
                const colors = {
                    DescriptorStream: 'color: #77ab59',
                    DeviceList: 'color: #36802d',
                    Device: 'color: #bada55',
                    Core: 'color: #c9df8a',
                    IFrame: 'color: #FFFFFF; background: #f4a742;',
                    Popup: 'color: #f48a00',
                };
                const MAX_ENTRIES = 100;

                class Log {
                    constructor(prefix, enabled) {
                        this.prefix = prefix;
                        this.enabled = enabled;
                        this.messages = [];
                        this.css = colors[prefix] || 'color: #000000; background: #FFFFFF;';
                    }

                    addMessage(level, prefix, ...args) {
                        this.messages.push({
                            level,
                            prefix,
                            message: args,
                            timestamp: new Date().getTime(),
                        });

                        if (this.messages.length > MAX_ENTRIES) {
                            this.messages.shift();
                        }
                    }

                    log(...args) {
                        this.addMessage('log', this.prefix, ...args);

                        if (this.enabled) {
                            console.log(this.prefix, ...args);
                        }
                    }

                    error(...args) {
                        this.addMessage('error', this.prefix, ...args);

                        if (this.enabled) {
                            console.error(this.prefix, ...args);
                        }
                    }

                    warn(...args) {
                        this.addMessage('warn', this.prefix, ...args);

                        if (this.enabled) {
                            console.warn(this.prefix, ...args);
                        }
                    }

                    debug(...args) {
                        this.addMessage('debug', this.prefix, ...args);

                        if (this.enabled) {
                            console.log(`%c${this.prefix}`, this.css, ...args);
                        }
                    }
                }

                const _logs = {};

                const initLog = (prefix, enabled) => {
                    const instance = new Log(prefix, !!enabled);
                    _logs[prefix] = instance;
                    return instance;
                };

                exports.initLog = initLog;

                const enableLog = enabled => {
                    Object.keys(_logs).forEach(key => {
                        _logs[key].enabled = enabled;
                    });
                };

                exports.enableLog = enableLog;

                const enableLogByPrefix = (prefix, enabled) => {
                    if (_logs[prefix]) {
                        _logs[prefix].enabled = enabled;
                    }
                };

                exports.enableLogByPrefix = enableLogByPrefix;

                const getLog = () => {
                    let logs = [];
                    Object.keys(_logs).forEach(key => {
                        logs = logs.concat(_logs[key].messages);
                    });
                    logs.sort((a, b) => a.timestamp - b.timestamp);
                    return logs;
                };

                exports.getLog = getLog;

                /***/
            },

            /***/ '../connect/lib/utils/urlUtils.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.getOnionDomain = exports.getOrigin = void 0;

                const getOrigin = url => {
                    if (typeof url !== 'string') return 'unknown';
                    if (url.indexOf('file://') === 0) return 'file://';
                    const parts = url.match(/^.+\:\/\/[^\/]+/);
                    return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
                };

                exports.getOrigin = getOrigin;

                const getOnionDomain = (url, dict) => {
                    if (Array.isArray(url)) {
                        return url.map(u => (0, exports.getOnionDomain)(u, dict));
                    }

                    if (typeof url === 'string') {
                        const [, protocol, subdomain, domain, rest] =
                            url.match(/^(http|ws)s?:\/\/([^:/]+\.)?([^/.]+\.[^/.]+)(\/.*)?$/i) ??
                            [];
                        if (!domain || !dict[domain]) return url;
                        return `${protocol}://${subdomain || ''}${dict[domain]}${rest || ''}`;
                    }

                    return url;
                };

                exports.getOnionDomain = getOnionDomain;

                /***/
            },

            /***/ '../transport/lib/types/messages.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.TezosBallotType =
                    exports.TezosContractType =
                    exports.StellarSignerType =
                    exports.StellarMemoType =
                    exports.StellarAssetType =
                    exports.NEMImportanceTransferMode =
                    exports.NEMModificationType =
                    exports.NEMSupplyChangeType =
                    exports.NEMMosaicLevy =
                    exports.Enum_WordRequestType =
                    exports.RecoveryDeviceType =
                    exports.SdProtectOperationType =
                    exports.Enum_Capability =
                    exports.Enum_SafetyCheckLevel =
                    exports.Enum_BackupType =
                    exports.EthereumDataType =
                    exports.DebugButton =
                    exports.Enum_PinMatrixRequestType =
                    exports.Enum_ButtonRequestType =
                    exports.FailureType =
                    exports.CardanoTxWitnessType =
                    exports.CardanoTxSigningMode =
                    exports.CardanoTxAuxiliaryDataSupplementType =
                    exports.CardanoPoolRelayType =
                    exports.CardanoCertificateType =
                    exports.CardanoNativeScriptHashDisplayFormat =
                    exports.CardanoNativeScriptType =
                    exports.CardanoAddressType =
                    exports.CardanoDerivationType =
                    exports.Enum_RequestType =
                    exports.AmountUnit =
                    exports.DecredStakingSpendType =
                    exports.Enum_OutputScriptType =
                    exports.Enum_InputScriptType =
                    exports.BinanceTimeInForce =
                    exports.BinanceOrderSide =
                    exports.BinanceOrderType =
                        void 0;
                var BinanceOrderType;

                (function (BinanceOrderType) {
                    BinanceOrderType[(BinanceOrderType['OT_UNKNOWN'] = 0)] = 'OT_UNKNOWN';
                    BinanceOrderType[(BinanceOrderType['MARKET'] = 1)] = 'MARKET';
                    BinanceOrderType[(BinanceOrderType['LIMIT'] = 2)] = 'LIMIT';
                    BinanceOrderType[(BinanceOrderType['OT_RESERVED'] = 3)] = 'OT_RESERVED';
                })(
                    (BinanceOrderType =
                        exports.BinanceOrderType || (exports.BinanceOrderType = {})),
                );

                var BinanceOrderSide;

                (function (BinanceOrderSide) {
                    BinanceOrderSide[(BinanceOrderSide['SIDE_UNKNOWN'] = 0)] = 'SIDE_UNKNOWN';
                    BinanceOrderSide[(BinanceOrderSide['BUY'] = 1)] = 'BUY';
                    BinanceOrderSide[(BinanceOrderSide['SELL'] = 2)] = 'SELL';
                })(
                    (BinanceOrderSide =
                        exports.BinanceOrderSide || (exports.BinanceOrderSide = {})),
                );

                var BinanceTimeInForce;

                (function (BinanceTimeInForce) {
                    BinanceTimeInForce[(BinanceTimeInForce['TIF_UNKNOWN'] = 0)] = 'TIF_UNKNOWN';
                    BinanceTimeInForce[(BinanceTimeInForce['GTE'] = 1)] = 'GTE';
                    BinanceTimeInForce[(BinanceTimeInForce['TIF_RESERVED'] = 2)] = 'TIF_RESERVED';
                    BinanceTimeInForce[(BinanceTimeInForce['IOC'] = 3)] = 'IOC';
                })(
                    (BinanceTimeInForce =
                        exports.BinanceTimeInForce || (exports.BinanceTimeInForce = {})),
                );

                var Enum_InputScriptType;

                (function (Enum_InputScriptType) {
                    Enum_InputScriptType[(Enum_InputScriptType['SPENDADDRESS'] = 0)] =
                        'SPENDADDRESS';
                    Enum_InputScriptType[(Enum_InputScriptType['SPENDMULTISIG'] = 1)] =
                        'SPENDMULTISIG';
                    Enum_InputScriptType[(Enum_InputScriptType['EXTERNAL'] = 2)] = 'EXTERNAL';
                    Enum_InputScriptType[(Enum_InputScriptType['SPENDWITNESS'] = 3)] =
                        'SPENDWITNESS';
                    Enum_InputScriptType[(Enum_InputScriptType['SPENDP2SHWITNESS'] = 4)] =
                        'SPENDP2SHWITNESS';
                    Enum_InputScriptType[(Enum_InputScriptType['SPENDTAPROOT'] = 5)] =
                        'SPENDTAPROOT';
                })(
                    (Enum_InputScriptType =
                        exports.Enum_InputScriptType || (exports.Enum_InputScriptType = {})),
                );

                var Enum_OutputScriptType;

                (function (Enum_OutputScriptType) {
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOADDRESS'] = 0)] =
                        'PAYTOADDRESS';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOSCRIPTHASH'] = 1)] =
                        'PAYTOSCRIPTHASH';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOMULTISIG'] = 2)] =
                        'PAYTOMULTISIG';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOOPRETURN'] = 3)] =
                        'PAYTOOPRETURN';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOWITNESS'] = 4)] =
                        'PAYTOWITNESS';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOP2SHWITNESS'] = 5)] =
                        'PAYTOP2SHWITNESS';
                    Enum_OutputScriptType[(Enum_OutputScriptType['PAYTOTAPROOT'] = 6)] =
                        'PAYTOTAPROOT';
                })(
                    (Enum_OutputScriptType =
                        exports.Enum_OutputScriptType || (exports.Enum_OutputScriptType = {})),
                );

                var DecredStakingSpendType;

                (function (DecredStakingSpendType) {
                    DecredStakingSpendType[(DecredStakingSpendType['SSGen'] = 0)] = 'SSGen';
                    DecredStakingSpendType[(DecredStakingSpendType['SSRTX'] = 1)] = 'SSRTX';
                })(
                    (DecredStakingSpendType =
                        exports.DecredStakingSpendType || (exports.DecredStakingSpendType = {})),
                );

                var AmountUnit;

                (function (AmountUnit) {
                    AmountUnit[(AmountUnit['BITCOIN'] = 0)] = 'BITCOIN';
                    AmountUnit[(AmountUnit['MILLIBITCOIN'] = 1)] = 'MILLIBITCOIN';
                    AmountUnit[(AmountUnit['MICROBITCOIN'] = 2)] = 'MICROBITCOIN';
                    AmountUnit[(AmountUnit['SATOSHI'] = 3)] = 'SATOSHI';
                })((AmountUnit = exports.AmountUnit || (exports.AmountUnit = {})));

                var Enum_RequestType;

                (function (Enum_RequestType) {
                    Enum_RequestType[(Enum_RequestType['TXINPUT'] = 0)] = 'TXINPUT';
                    Enum_RequestType[(Enum_RequestType['TXOUTPUT'] = 1)] = 'TXOUTPUT';
                    Enum_RequestType[(Enum_RequestType['TXMETA'] = 2)] = 'TXMETA';
                    Enum_RequestType[(Enum_RequestType['TXFINISHED'] = 3)] = 'TXFINISHED';
                    Enum_RequestType[(Enum_RequestType['TXEXTRADATA'] = 4)] = 'TXEXTRADATA';
                    Enum_RequestType[(Enum_RequestType['TXORIGINPUT'] = 5)] = 'TXORIGINPUT';
                    Enum_RequestType[(Enum_RequestType['TXORIGOUTPUT'] = 6)] = 'TXORIGOUTPUT';
                    Enum_RequestType[(Enum_RequestType['TXPAYMENTREQ'] = 7)] = 'TXPAYMENTREQ';
                })(
                    (Enum_RequestType =
                        exports.Enum_RequestType || (exports.Enum_RequestType = {})),
                );

                var CardanoDerivationType;

                (function (CardanoDerivationType) {
                    CardanoDerivationType[(CardanoDerivationType['LEDGER'] = 0)] = 'LEDGER';
                    CardanoDerivationType[(CardanoDerivationType['ICARUS'] = 1)] = 'ICARUS';
                    CardanoDerivationType[(CardanoDerivationType['ICARUS_TREZOR'] = 2)] =
                        'ICARUS_TREZOR';
                })(
                    (CardanoDerivationType =
                        exports.CardanoDerivationType || (exports.CardanoDerivationType = {})),
                );

                var CardanoAddressType;

                (function (CardanoAddressType) {
                    CardanoAddressType[(CardanoAddressType['BASE'] = 0)] = 'BASE';
                    CardanoAddressType[(CardanoAddressType['BASE_SCRIPT_KEY'] = 1)] =
                        'BASE_SCRIPT_KEY';
                    CardanoAddressType[(CardanoAddressType['BASE_KEY_SCRIPT'] = 2)] =
                        'BASE_KEY_SCRIPT';
                    CardanoAddressType[(CardanoAddressType['BASE_SCRIPT_SCRIPT'] = 3)] =
                        'BASE_SCRIPT_SCRIPT';
                    CardanoAddressType[(CardanoAddressType['POINTER'] = 4)] = 'POINTER';
                    CardanoAddressType[(CardanoAddressType['POINTER_SCRIPT'] = 5)] =
                        'POINTER_SCRIPT';
                    CardanoAddressType[(CardanoAddressType['ENTERPRISE'] = 6)] = 'ENTERPRISE';
                    CardanoAddressType[(CardanoAddressType['ENTERPRISE_SCRIPT'] = 7)] =
                        'ENTERPRISE_SCRIPT';
                    CardanoAddressType[(CardanoAddressType['BYRON'] = 8)] = 'BYRON';
                    CardanoAddressType[(CardanoAddressType['REWARD'] = 14)] = 'REWARD';
                    CardanoAddressType[(CardanoAddressType['REWARD_SCRIPT'] = 15)] =
                        'REWARD_SCRIPT';
                })(
                    (CardanoAddressType =
                        exports.CardanoAddressType || (exports.CardanoAddressType = {})),
                );

                var CardanoNativeScriptType;

                (function (CardanoNativeScriptType) {
                    CardanoNativeScriptType[(CardanoNativeScriptType['PUB_KEY'] = 0)] = 'PUB_KEY';
                    CardanoNativeScriptType[(CardanoNativeScriptType['ALL'] = 1)] = 'ALL';
                    CardanoNativeScriptType[(CardanoNativeScriptType['ANY'] = 2)] = 'ANY';
                    CardanoNativeScriptType[(CardanoNativeScriptType['N_OF_K'] = 3)] = 'N_OF_K';
                    CardanoNativeScriptType[(CardanoNativeScriptType['INVALID_BEFORE'] = 4)] =
                        'INVALID_BEFORE';
                    CardanoNativeScriptType[(CardanoNativeScriptType['INVALID_HEREAFTER'] = 5)] =
                        'INVALID_HEREAFTER';
                })(
                    (CardanoNativeScriptType =
                        exports.CardanoNativeScriptType || (exports.CardanoNativeScriptType = {})),
                );

                var CardanoNativeScriptHashDisplayFormat;

                (function (CardanoNativeScriptHashDisplayFormat) {
                    CardanoNativeScriptHashDisplayFormat[
                        (CardanoNativeScriptHashDisplayFormat['HIDE'] = 0)
                    ] = 'HIDE';
                    CardanoNativeScriptHashDisplayFormat[
                        (CardanoNativeScriptHashDisplayFormat['BECH32'] = 1)
                    ] = 'BECH32';
                    CardanoNativeScriptHashDisplayFormat[
                        (CardanoNativeScriptHashDisplayFormat['POLICY_ID'] = 2)
                    ] = 'POLICY_ID';
                })(
                    (CardanoNativeScriptHashDisplayFormat =
                        exports.CardanoNativeScriptHashDisplayFormat ||
                        (exports.CardanoNativeScriptHashDisplayFormat = {})),
                );

                var CardanoCertificateType;

                (function (CardanoCertificateType) {
                    CardanoCertificateType[(CardanoCertificateType['STAKE_REGISTRATION'] = 0)] =
                        'STAKE_REGISTRATION';
                    CardanoCertificateType[(CardanoCertificateType['STAKE_DEREGISTRATION'] = 1)] =
                        'STAKE_DEREGISTRATION';
                    CardanoCertificateType[(CardanoCertificateType['STAKE_DELEGATION'] = 2)] =
                        'STAKE_DELEGATION';
                    CardanoCertificateType[
                        (CardanoCertificateType['STAKE_POOL_REGISTRATION'] = 3)
                    ] = 'STAKE_POOL_REGISTRATION';
                })(
                    (CardanoCertificateType =
                        exports.CardanoCertificateType || (exports.CardanoCertificateType = {})),
                );

                var CardanoPoolRelayType;

                (function (CardanoPoolRelayType) {
                    CardanoPoolRelayType[(CardanoPoolRelayType['SINGLE_HOST_IP'] = 0)] =
                        'SINGLE_HOST_IP';
                    CardanoPoolRelayType[(CardanoPoolRelayType['SINGLE_HOST_NAME'] = 1)] =
                        'SINGLE_HOST_NAME';
                    CardanoPoolRelayType[(CardanoPoolRelayType['MULTIPLE_HOST_NAME'] = 2)] =
                        'MULTIPLE_HOST_NAME';
                })(
                    (CardanoPoolRelayType =
                        exports.CardanoPoolRelayType || (exports.CardanoPoolRelayType = {})),
                );

                var CardanoTxAuxiliaryDataSupplementType;

                (function (CardanoTxAuxiliaryDataSupplementType) {
                    CardanoTxAuxiliaryDataSupplementType[
                        (CardanoTxAuxiliaryDataSupplementType['NONE'] = 0)
                    ] = 'NONE';
                    CardanoTxAuxiliaryDataSupplementType[
                        (CardanoTxAuxiliaryDataSupplementType[
                            'CATALYST_REGISTRATION_SIGNATURE'
                        ] = 1)
                    ] = 'CATALYST_REGISTRATION_SIGNATURE';
                })(
                    (CardanoTxAuxiliaryDataSupplementType =
                        exports.CardanoTxAuxiliaryDataSupplementType ||
                        (exports.CardanoTxAuxiliaryDataSupplementType = {})),
                );

                var CardanoTxSigningMode;

                (function (CardanoTxSigningMode) {
                    CardanoTxSigningMode[(CardanoTxSigningMode['ORDINARY_TRANSACTION'] = 0)] =
                        'ORDINARY_TRANSACTION';
                    CardanoTxSigningMode[(CardanoTxSigningMode['POOL_REGISTRATION_AS_OWNER'] = 1)] =
                        'POOL_REGISTRATION_AS_OWNER';
                    CardanoTxSigningMode[(CardanoTxSigningMode['MULTISIG_TRANSACTION'] = 2)] =
                        'MULTISIG_TRANSACTION';
                    CardanoTxSigningMode[(CardanoTxSigningMode['PLUTUS_TRANSACTION'] = 3)] =
                        'PLUTUS_TRANSACTION';
                })(
                    (CardanoTxSigningMode =
                        exports.CardanoTxSigningMode || (exports.CardanoTxSigningMode = {})),
                );

                var CardanoTxWitnessType;

                (function (CardanoTxWitnessType) {
                    CardanoTxWitnessType[(CardanoTxWitnessType['BYRON_WITNESS'] = 0)] =
                        'BYRON_WITNESS';
                    CardanoTxWitnessType[(CardanoTxWitnessType['SHELLEY_WITNESS'] = 1)] =
                        'SHELLEY_WITNESS';
                })(
                    (CardanoTxWitnessType =
                        exports.CardanoTxWitnessType || (exports.CardanoTxWitnessType = {})),
                );

                var FailureType;

                (function (FailureType) {
                    FailureType[(FailureType['Failure_UnexpectedMessage'] = 1)] =
                        'Failure_UnexpectedMessage';
                    FailureType[(FailureType['Failure_ButtonExpected'] = 2)] =
                        'Failure_ButtonExpected';
                    FailureType[(FailureType['Failure_DataError'] = 3)] = 'Failure_DataError';
                    FailureType[(FailureType['Failure_ActionCancelled'] = 4)] =
                        'Failure_ActionCancelled';
                    FailureType[(FailureType['Failure_PinExpected'] = 5)] = 'Failure_PinExpected';
                    FailureType[(FailureType['Failure_PinCancelled'] = 6)] = 'Failure_PinCancelled';
                    FailureType[(FailureType['Failure_PinInvalid'] = 7)] = 'Failure_PinInvalid';
                    FailureType[(FailureType['Failure_InvalidSignature'] = 8)] =
                        'Failure_InvalidSignature';
                    FailureType[(FailureType['Failure_ProcessError'] = 9)] = 'Failure_ProcessError';
                    FailureType[(FailureType['Failure_NotEnoughFunds'] = 10)] =
                        'Failure_NotEnoughFunds';
                    FailureType[(FailureType['Failure_NotInitialized'] = 11)] =
                        'Failure_NotInitialized';
                    FailureType[(FailureType['Failure_PinMismatch'] = 12)] = 'Failure_PinMismatch';
                    FailureType[(FailureType['Failure_WipeCodeMismatch'] = 13)] =
                        'Failure_WipeCodeMismatch';
                    FailureType[(FailureType['Failure_InvalidSession'] = 14)] =
                        'Failure_InvalidSession';
                    FailureType[(FailureType['Failure_FirmwareError'] = 99)] =
                        'Failure_FirmwareError';
                })((FailureType = exports.FailureType || (exports.FailureType = {})));

                var Enum_ButtonRequestType;

                (function (Enum_ButtonRequestType) {
                    Enum_ButtonRequestType[(Enum_ButtonRequestType['ButtonRequest_Other'] = 1)] =
                        'ButtonRequest_Other';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_FeeOverThreshold'] = 2)
                    ] = 'ButtonRequest_FeeOverThreshold';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_ConfirmOutput'] = 3)
                    ] = 'ButtonRequest_ConfirmOutput';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_ResetDevice'] = 4)
                    ] = 'ButtonRequest_ResetDevice';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_ConfirmWord'] = 5)
                    ] = 'ButtonRequest_ConfirmWord';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_WipeDevice'] = 6)
                    ] = 'ButtonRequest_WipeDevice';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_ProtectCall'] = 7)
                    ] = 'ButtonRequest_ProtectCall';
                    Enum_ButtonRequestType[(Enum_ButtonRequestType['ButtonRequest_SignTx'] = 8)] =
                        'ButtonRequest_SignTx';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_FirmwareCheck'] = 9)
                    ] = 'ButtonRequest_FirmwareCheck';
                    Enum_ButtonRequestType[(Enum_ButtonRequestType['ButtonRequest_Address'] = 10)] =
                        'ButtonRequest_Address';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_PublicKey'] = 11)
                    ] = 'ButtonRequest_PublicKey';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_MnemonicWordCount'] = 12)
                    ] = 'ButtonRequest_MnemonicWordCount';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_MnemonicInput'] = 13)
                    ] = 'ButtonRequest_MnemonicInput';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['_Deprecated_ButtonRequest_PassphraseType'] = 14)
                    ] = '_Deprecated_ButtonRequest_PassphraseType';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_UnknownDerivationPath'] = 15)
                    ] = 'ButtonRequest_UnknownDerivationPath';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_RecoveryHomepage'] = 16)
                    ] = 'ButtonRequest_RecoveryHomepage';
                    Enum_ButtonRequestType[(Enum_ButtonRequestType['ButtonRequest_Success'] = 17)] =
                        'ButtonRequest_Success';
                    Enum_ButtonRequestType[(Enum_ButtonRequestType['ButtonRequest_Warning'] = 18)] =
                        'ButtonRequest_Warning';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_PassphraseEntry'] = 19)
                    ] = 'ButtonRequest_PassphraseEntry';
                    Enum_ButtonRequestType[
                        (Enum_ButtonRequestType['ButtonRequest_PinEntry'] = 20)
                    ] = 'ButtonRequest_PinEntry';
                })(
                    (Enum_ButtonRequestType =
                        exports.Enum_ButtonRequestType || (exports.Enum_ButtonRequestType = {})),
                );

                var Enum_PinMatrixRequestType;

                (function (Enum_PinMatrixRequestType) {
                    Enum_PinMatrixRequestType[
                        (Enum_PinMatrixRequestType['PinMatrixRequestType_Current'] = 1)
                    ] = 'PinMatrixRequestType_Current';
                    Enum_PinMatrixRequestType[
                        (Enum_PinMatrixRequestType['PinMatrixRequestType_NewFirst'] = 2)
                    ] = 'PinMatrixRequestType_NewFirst';
                    Enum_PinMatrixRequestType[
                        (Enum_PinMatrixRequestType['PinMatrixRequestType_NewSecond'] = 3)
                    ] = 'PinMatrixRequestType_NewSecond';
                    Enum_PinMatrixRequestType[
                        (Enum_PinMatrixRequestType['PinMatrixRequestType_WipeCodeFirst'] = 4)
                    ] = 'PinMatrixRequestType_WipeCodeFirst';
                    Enum_PinMatrixRequestType[
                        (Enum_PinMatrixRequestType['PinMatrixRequestType_WipeCodeSecond'] = 5)
                    ] = 'PinMatrixRequestType_WipeCodeSecond';
                })(
                    (Enum_PinMatrixRequestType =
                        exports.Enum_PinMatrixRequestType ||
                        (exports.Enum_PinMatrixRequestType = {})),
                );

                var DebugButton;

                (function (DebugButton) {
                    DebugButton[(DebugButton['NO'] = 0)] = 'NO';
                    DebugButton[(DebugButton['YES'] = 1)] = 'YES';
                    DebugButton[(DebugButton['INFO'] = 2)] = 'INFO';
                })((DebugButton = exports.DebugButton || (exports.DebugButton = {})));

                var EthereumDataType;

                (function (EthereumDataType) {
                    EthereumDataType[(EthereumDataType['UINT'] = 1)] = 'UINT';
                    EthereumDataType[(EthereumDataType['INT'] = 2)] = 'INT';
                    EthereumDataType[(EthereumDataType['BYTES'] = 3)] = 'BYTES';
                    EthereumDataType[(EthereumDataType['STRING'] = 4)] = 'STRING';
                    EthereumDataType[(EthereumDataType['BOOL'] = 5)] = 'BOOL';
                    EthereumDataType[(EthereumDataType['ADDRESS'] = 6)] = 'ADDRESS';
                    EthereumDataType[(EthereumDataType['ARRAY'] = 7)] = 'ARRAY';
                    EthereumDataType[(EthereumDataType['STRUCT'] = 8)] = 'STRUCT';
                })(
                    (EthereumDataType =
                        exports.EthereumDataType || (exports.EthereumDataType = {})),
                );

                var Enum_BackupType;

                (function (Enum_BackupType) {
                    Enum_BackupType[(Enum_BackupType['Bip39'] = 0)] = 'Bip39';
                    Enum_BackupType[(Enum_BackupType['Slip39_Basic'] = 1)] = 'Slip39_Basic';
                    Enum_BackupType[(Enum_BackupType['Slip39_Advanced'] = 2)] = 'Slip39_Advanced';
                })((Enum_BackupType = exports.Enum_BackupType || (exports.Enum_BackupType = {})));

                var Enum_SafetyCheckLevel;

                (function (Enum_SafetyCheckLevel) {
                    Enum_SafetyCheckLevel[(Enum_SafetyCheckLevel['Strict'] = 0)] = 'Strict';
                    Enum_SafetyCheckLevel[(Enum_SafetyCheckLevel['PromptAlways'] = 1)] =
                        'PromptAlways';
                    Enum_SafetyCheckLevel[(Enum_SafetyCheckLevel['PromptTemporarily'] = 2)] =
                        'PromptTemporarily';
                })(
                    (Enum_SafetyCheckLevel =
                        exports.Enum_SafetyCheckLevel || (exports.Enum_SafetyCheckLevel = {})),
                );

                var Enum_Capability;

                (function (Enum_Capability) {
                    Enum_Capability[(Enum_Capability['Capability_Bitcoin'] = 1)] =
                        'Capability_Bitcoin';
                    Enum_Capability[(Enum_Capability['Capability_Bitcoin_like'] = 2)] =
                        'Capability_Bitcoin_like';
                    Enum_Capability[(Enum_Capability['Capability_Binance'] = 3)] =
                        'Capability_Binance';
                    Enum_Capability[(Enum_Capability['Capability_Cardano'] = 4)] =
                        'Capability_Cardano';
                    Enum_Capability[(Enum_Capability['Capability_Crypto'] = 5)] =
                        'Capability_Crypto';
                    Enum_Capability[(Enum_Capability['Capability_EOS'] = 6)] = 'Capability_EOS';
                    Enum_Capability[(Enum_Capability['Capability_Ethereum'] = 7)] =
                        'Capability_Ethereum';
                    Enum_Capability[(Enum_Capability['Capability_Lisk'] = 8)] = 'Capability_Lisk';
                    Enum_Capability[(Enum_Capability['Capability_Monero'] = 9)] =
                        'Capability_Monero';
                    Enum_Capability[(Enum_Capability['Capability_NEM'] = 10)] = 'Capability_NEM';
                    Enum_Capability[(Enum_Capability['Capability_Ripple'] = 11)] =
                        'Capability_Ripple';
                    Enum_Capability[(Enum_Capability['Capability_Stellar'] = 12)] =
                        'Capability_Stellar';
                    Enum_Capability[(Enum_Capability['Capability_Tezos'] = 13)] =
                        'Capability_Tezos';
                    Enum_Capability[(Enum_Capability['Capability_U2F'] = 14)] = 'Capability_U2F';
                    Enum_Capability[(Enum_Capability['Capability_Shamir'] = 15)] =
                        'Capability_Shamir';
                    Enum_Capability[(Enum_Capability['Capability_ShamirGroups'] = 16)] =
                        'Capability_ShamirGroups';
                    Enum_Capability[(Enum_Capability['Capability_PassphraseEntry'] = 17)] =
                        'Capability_PassphraseEntry';
                })((Enum_Capability = exports.Enum_Capability || (exports.Enum_Capability = {})));

                var SdProtectOperationType;

                (function (SdProtectOperationType) {
                    SdProtectOperationType[(SdProtectOperationType['DISABLE'] = 0)] = 'DISABLE';
                    SdProtectOperationType[(SdProtectOperationType['ENABLE'] = 1)] = 'ENABLE';
                    SdProtectOperationType[(SdProtectOperationType['REFRESH'] = 2)] = 'REFRESH';
                })(
                    (SdProtectOperationType =
                        exports.SdProtectOperationType || (exports.SdProtectOperationType = {})),
                );

                var RecoveryDeviceType;

                (function (RecoveryDeviceType) {
                    RecoveryDeviceType[
                        (RecoveryDeviceType['RecoveryDeviceType_ScrambledWords'] = 0)
                    ] = 'RecoveryDeviceType_ScrambledWords';
                    RecoveryDeviceType[(RecoveryDeviceType['RecoveryDeviceType_Matrix'] = 1)] =
                        'RecoveryDeviceType_Matrix';
                })(
                    (RecoveryDeviceType =
                        exports.RecoveryDeviceType || (exports.RecoveryDeviceType = {})),
                );

                var Enum_WordRequestType;

                (function (Enum_WordRequestType) {
                    Enum_WordRequestType[(Enum_WordRequestType['WordRequestType_Plain'] = 0)] =
                        'WordRequestType_Plain';
                    Enum_WordRequestType[(Enum_WordRequestType['WordRequestType_Matrix9'] = 1)] =
                        'WordRequestType_Matrix9';
                    Enum_WordRequestType[(Enum_WordRequestType['WordRequestType_Matrix6'] = 2)] =
                        'WordRequestType_Matrix6';
                })(
                    (Enum_WordRequestType =
                        exports.Enum_WordRequestType || (exports.Enum_WordRequestType = {})),
                );

                var NEMMosaicLevy;

                (function (NEMMosaicLevy) {
                    NEMMosaicLevy[(NEMMosaicLevy['MosaicLevy_Absolute'] = 1)] =
                        'MosaicLevy_Absolute';
                    NEMMosaicLevy[(NEMMosaicLevy['MosaicLevy_Percentile'] = 2)] =
                        'MosaicLevy_Percentile';
                })((NEMMosaicLevy = exports.NEMMosaicLevy || (exports.NEMMosaicLevy = {})));

                var NEMSupplyChangeType;

                (function (NEMSupplyChangeType) {
                    NEMSupplyChangeType[(NEMSupplyChangeType['SupplyChange_Increase'] = 1)] =
                        'SupplyChange_Increase';
                    NEMSupplyChangeType[(NEMSupplyChangeType['SupplyChange_Decrease'] = 2)] =
                        'SupplyChange_Decrease';
                })(
                    (NEMSupplyChangeType =
                        exports.NEMSupplyChangeType || (exports.NEMSupplyChangeType = {})),
                );

                var NEMModificationType;

                (function (NEMModificationType) {
                    NEMModificationType[(NEMModificationType['CosignatoryModification_Add'] = 1)] =
                        'CosignatoryModification_Add';
                    NEMModificationType[
                        (NEMModificationType['CosignatoryModification_Delete'] = 2)
                    ] = 'CosignatoryModification_Delete';
                })(
                    (NEMModificationType =
                        exports.NEMModificationType || (exports.NEMModificationType = {})),
                );

                var NEMImportanceTransferMode;

                (function (NEMImportanceTransferMode) {
                    NEMImportanceTransferMode[
                        (NEMImportanceTransferMode['ImportanceTransfer_Activate'] = 1)
                    ] = 'ImportanceTransfer_Activate';
                    NEMImportanceTransferMode[
                        (NEMImportanceTransferMode['ImportanceTransfer_Deactivate'] = 2)
                    ] = 'ImportanceTransfer_Deactivate';
                })(
                    (NEMImportanceTransferMode =
                        exports.NEMImportanceTransferMode ||
                        (exports.NEMImportanceTransferMode = {})),
                );

                var StellarAssetType;

                (function (StellarAssetType) {
                    StellarAssetType[(StellarAssetType['NATIVE'] = 0)] = 'NATIVE';
                    StellarAssetType[(StellarAssetType['ALPHANUM4'] = 1)] = 'ALPHANUM4';
                    StellarAssetType[(StellarAssetType['ALPHANUM12'] = 2)] = 'ALPHANUM12';
                })(
                    (StellarAssetType =
                        exports.StellarAssetType || (exports.StellarAssetType = {})),
                );

                var StellarMemoType;

                (function (StellarMemoType) {
                    StellarMemoType[(StellarMemoType['NONE'] = 0)] = 'NONE';
                    StellarMemoType[(StellarMemoType['TEXT'] = 1)] = 'TEXT';
                    StellarMemoType[(StellarMemoType['ID'] = 2)] = 'ID';
                    StellarMemoType[(StellarMemoType['HASH'] = 3)] = 'HASH';
                    StellarMemoType[(StellarMemoType['RETURN'] = 4)] = 'RETURN';
                })((StellarMemoType = exports.StellarMemoType || (exports.StellarMemoType = {})));

                var StellarSignerType;

                (function (StellarSignerType) {
                    StellarSignerType[(StellarSignerType['ACCOUNT'] = 0)] = 'ACCOUNT';
                    StellarSignerType[(StellarSignerType['PRE_AUTH'] = 1)] = 'PRE_AUTH';
                    StellarSignerType[(StellarSignerType['HASH'] = 2)] = 'HASH';
                })(
                    (StellarSignerType =
                        exports.StellarSignerType || (exports.StellarSignerType = {})),
                );

                var TezosContractType;

                (function (TezosContractType) {
                    TezosContractType[(TezosContractType['Implicit'] = 0)] = 'Implicit';
                    TezosContractType[(TezosContractType['Originated'] = 1)] = 'Originated';
                })(
                    (TezosContractType =
                        exports.TezosContractType || (exports.TezosContractType = {})),
                );

                var TezosBallotType;

                (function (TezosBallotType) {
                    TezosBallotType[(TezosBallotType['Yay'] = 0)] = 'Yay';
                    TezosBallotType[(TezosBallotType['Nay'] = 1)] = 'Nay';
                    TezosBallotType[(TezosBallotType['Pass'] = 2)] = 'Pass';
                })((TezosBallotType = exports.TezosBallotType || (exports.TezosBallotType = {})));

                /***/
            },

            /***/ '../utils/lib/arrayDistinct.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.arrayDistinct = void 0;

                const arrayDistinct = (item, index, self) => self.indexOf(item) === index;

                exports.arrayDistinct = arrayDistinct;

                /***/
            },

            /***/ '../utils/lib/arrayPartition.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.arrayPartition = void 0;

                const arrayPartition = (array, condition) =>
                    array.reduce(
                        ([pass, fail], elem) =>
                            condition(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]],
                        [[], []],
                    );

                exports.arrayPartition = arrayPartition;

                /***/
            },

            /***/ '../utils/lib/arrayToDictionary.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.arrayToDictionary = void 0;

                const arrayToDictionary = (array, getKey) =>
                    array.reduce(
                        (prev, cur) =>
                            Object.assign(Object.assign({}, prev), {
                                [getKey(cur)]: cur,
                            }),
                        {},
                    );

                exports.arrayToDictionary = arrayToDictionary;

                /***/
            },

            /***/ '../utils/lib/bytesToHumanReadable.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.bytesToHumanReadable = void 0;
                const units = ['B', 'KB', 'MB', 'GB', 'TB'];

                const bytesToHumanReadable = bytes => {
                    let size = Math.abs(bytes);
                    let i = 0;

                    while (size >= 1024 || i >= units.length) {
                        size /= 1024;
                        i++;
                    }

                    return `${size.toFixed(1)} ${units[i]}`;
                };

                exports.bytesToHumanReadable = bytesToHumanReadable;

                /***/
            },

            /***/ '../utils/lib/capitalizeFirstLetter.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.capitalizeFirstLetter = void 0;

                const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

                exports.capitalizeFirstLetter = capitalizeFirstLetter;

                /***/
            },

            /***/ '../utils/lib/countBytesInString.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.countBytesInString = void 0;

                const countBytesInString = input => encodeURI(input).split(/%..|./).length - 1;

                exports.countBytesInString = countBytesInString;

                /***/
            },

            /***/ '../utils/lib/createDeferred.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.createDeferred = void 0;

                const createDeferred = id => {
                    let localResolve = () => {};

                    let localReject = () => {};

                    const promise = new Promise((resolve, reject) => {
                        localResolve = resolve;
                        localReject = reject;
                    });
                    return {
                        id,
                        resolve: localResolve,
                        reject: localReject,
                        promise,
                    };
                };

                exports.createDeferred = createDeferred;

                /***/
            },

            /***/ '../utils/lib/getNumberFromPixelString.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.getNumberFromPixelString = void 0;

                const getNumberFromPixelString = size => parseInt(size.replace('px', ''), 10);

                exports.getNumberFromPixelString = getNumberFromPixelString;

                /***/
            },

            /***/ '../utils/lib/getRandomNumberInRange.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.getRandomNumberInRange = void 0;

                const getRandomNumberInRange = (min, max) =>
                    Math.floor(Math.random() * (max - min + 1)) + min;

                exports.getRandomNumberInRange = getRandomNumberInRange;

                /***/
            },

            /***/ '../utils/lib/getWeakRandomId.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.getWeakRandomId = void 0;

                const getWeakRandomId = length => {
                    let id = '';
                    const list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                    for (let i = 0; i < length; i++) {
                        id += list.charAt(Math.floor(Math.random() * list.length));
                    }

                    return id;
                };

                exports.getWeakRandomId = getWeakRandomId;

                /***/
            },

            /***/ '../utils/lib/hasUppercaseLetter.js': /***/ (
                __unused_webpack_module,
                exports,
            ) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.hasUppercaseLetter = void 0;
                const HAS_UPPERCASE_LATER_REGEXP = new RegExp('^(.*[A-Z].*)$');

                const hasUppercaseLetter = value => HAS_UPPERCASE_LATER_REGEXP.test(value);

                exports.hasUppercaseLetter = hasUppercaseLetter;

                /***/
            },

            /***/ '../utils/lib/index.js': /***/ function (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) {
                var __createBinding =
                    (this && this.__createBinding) ||
                    (Object.create
                        ? function (o, m, k, k2) {
                              if (k2 === undefined) k2 = k;
                              Object.defineProperty(o, k2, {
                                  enumerable: true,
                                  get: function () {
                                      return m[k];
                                  },
                              });
                          }
                        : function (o, m, k, k2) {
                              if (k2 === undefined) k2 = k;
                              o[k2] = m[k];
                          });

                var __setModuleDefault =
                    (this && this.__setModuleDefault) ||
                    (Object.create
                        ? function (o, v) {
                              Object.defineProperty(o, 'default', {
                                  enumerable: true,
                                  value: v,
                              });
                          }
                        : function (o, v) {
                              o['default'] = v;
                          });

                var __exportStar =
                    (this && this.__exportStar) ||
                    function (m, exports) {
                        for (var p in m)
                            if (
                                p !== 'default' &&
                                !Object.prototype.hasOwnProperty.call(exports, p)
                            )
                                __createBinding(exports, m, p);
                    };

                var __importStar =
                    (this && this.__importStar) ||
                    function (mod) {
                        if (mod && mod.__esModule) return mod;
                        var result = {};
                        if (mod != null)
                            for (var k in mod)
                                if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
                                    __createBinding(result, mod, k);

                        __setModuleDefault(result, mod);

                        return result;
                    };

                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.versionUtils = void 0;

                __exportStar(__webpack_require__('../utils/lib/createDeferred.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/arrayDistinct.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/arrayPartition.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/arrayToDictionary.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/bytesToHumanReadable.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/mergeObject.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/getWeakRandomId.js'), exports);

                __exportStar(
                    __webpack_require__('../utils/lib/getRandomNumberInRange.js'),
                    exports,
                );

                __exportStar(__webpack_require__('../utils/lib/capitalizeFirstLetter.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/countBytesInString.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/truncateMiddle.js'), exports);

                __exportStar(
                    __webpack_require__('../utils/lib/getNumberFromPixelString.js'),
                    exports,
                );

                __exportStar(__webpack_require__('../utils/lib/isUrl.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/hasUppercaseLetter.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/isAscii.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/isNotUndefined.js'), exports);

                exports.versionUtils = __importStar(
                    __webpack_require__('../utils/lib/versionUtils.js'),
                );

                __exportStar(__webpack_require__('../utils/lib/objectPartition.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/throwError.js'), exports);

                __exportStar(__webpack_require__('../utils/lib/isHex.js'), exports);

                /***/
            },

            /***/ '../utils/lib/isAscii.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.isAscii = void 0;

                function isAscii(value) {
                    if (!value) return true;
                    return /^[\x00-\x7F]*$/.test(value);
                }

                exports.isAscii = isAscii;

                /***/
            },

            /***/ '../utils/lib/isHex.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.isHex = void 0;

                const isHex = str => {
                    const regExp = /^(0x|0X)?[0-9A-Fa-f]+$/g;
                    return regExp.test(str);
                };

                exports.isHex = isHex;

                /***/
            },

            /***/ '../utils/lib/isNotUndefined.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.isNotUndefined = void 0;

                const isNotUndefined = item => typeof item !== 'undefined';

                exports.isNotUndefined = isNotUndefined;

                /***/
            },

            /***/ '../utils/lib/isUrl.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.isUrl = void 0;
                const URL_REGEXP =
                    /^(http|ws)s?:\/\/[a-z0-9]([a-z0-9.-]+)?(:[0-9]{1,5})?((\/)?(([a-z0-9-_])+(\/)?)+)$/i;

                const isUrl = value => URL_REGEXP.test(value);

                exports.isUrl = isUrl;

                /***/
            },

            /***/ '../utils/lib/mergeObject.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.mergeObject = void 0;

                const mergeObject = (target, source) => {
                    Object.keys(source).forEach(key => {
                        if (source instanceof Object && source[key] instanceof Object) {
                            Object.assign(
                                source[key],
                                (0, exports.mergeObject)(target[key], source[key]),
                            );
                        }
                    });
                    Object.assign(target || {}, source);
                    return target;
                };

                exports.mergeObject = mergeObject;

                /***/
            },

            /***/ '../utils/lib/objectPartition.js': /***/ function (
                __unused_webpack_module,
                exports,
            ) {
                var __rest =
                    (this && this.__rest) ||
                    function (s, e) {
                        var t = {};

                        for (var p in s)
                            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                                t[p] = s[p];

                        if (s != null && typeof Object.getOwnPropertySymbols === 'function')
                            for (
                                var i = 0, p = Object.getOwnPropertySymbols(s);
                                i < p.length;
                                i++
                            ) {
                                if (
                                    e.indexOf(p[i]) < 0 &&
                                    Object.prototype.propertyIsEnumerable.call(s, p[i])
                                )
                                    t[p[i]] = s[p[i]];
                            }
                        return t;
                    };

                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.objectPartition = void 0;

                const objectPartition = (obj, keys) =>
                    keys.reduce(
                        ([included, excluded], key) => {
                            const _a = excluded,
                                _b = key,
                                value = _a[_b],
                                rest = __rest(_a, [typeof _b === 'symbol' ? _b : _b + '']);

                            return typeof value !== 'undefined'
                                ? [
                                      Object.assign(Object.assign({}, included), {
                                          [key]: value,
                                      }),
                                      rest,
                                  ]
                                : [included, excluded];
                        },
                        [{}, obj],
                    );

                exports.objectPartition = objectPartition;

                /***/
            },

            /***/ '../utils/lib/throwError.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.throwError = void 0;

                const throwError = reason => {
                    throw new Error(reason);
                };

                exports.throwError = throwError;

                /***/
            },

            /***/ '../utils/lib/truncateMiddle.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.truncateMiddle = void 0;

                const truncateMiddle = (text, startChars, endChars) => {
                    if (text.length <= startChars + endChars) return text;
                    const start = text.substring(0, startChars);
                    const end = text.substring(text.length - endChars, text.length);
                    return `${start}…${end}`;
                };

                exports.truncateMiddle = truncateMiddle;

                /***/
            },

            /***/ '../utils/lib/versionUtils.js': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', {
                    value: true,
                });
                exports.isNewerOrEqual = exports.isEqual = exports.isNewer = void 0;

                const parse = versionArr => ({
                    major: versionArr[0],
                    minor: versionArr[1],
                    patch: versionArr[2],
                });

                const split = version => {
                    const arr = version.split('.');

                    if (arr.length !== 3) {
                        throw new Error('version string is in wrong format');
                    }

                    return arr;
                };

                const toString = arr => `${arr[0]}.${arr[1]}.${arr[2]}`;

                const isNewer = (versionX, versionY) => {
                    const parsedX = parse(
                        typeof versionX === 'string' ? split(versionX) : versionX,
                    );
                    const parsedY = parse(
                        typeof versionY === 'string' ? split(versionY) : versionY,
                    );

                    if (parsedX.major - parsedY.major !== 0) {
                        return parsedX.major > parsedY.major;
                    }

                    if (parsedX.minor - parsedY.minor !== 0) {
                        return parsedX.minor > parsedY.minor;
                    }

                    if (parsedX.patch - parsedY.patch !== 0) {
                        return parsedX.patch > parsedY.patch;
                    }

                    return false;
                };

                exports.isNewer = isNewer;

                const isEqual = (versionX, versionY) => {
                    const strX = typeof versionX === 'string' ? versionX : toString(versionX);
                    const strY = typeof versionY === 'string' ? versionY : toString(versionY);
                    return strX === strY;
                };

                exports.isEqual = isEqual;

                const isNewerOrEqual = (versionX, versionY) =>
                    (0, exports.isNewer)(versionX, versionY) ||
                    (0, exports.isEqual)(versionX, versionY);

                exports.isNewerOrEqual = isNewerOrEqual;

                /***/
            },

            /***/ '../../node_modules/events/events.js': /***/ module => {
                // Copyright Joyent, Inc. and other Node contributors.
                //
                // Permission is hereby granted, free of charge, to any person obtaining a
                // copy of this software and associated documentation files (the
                // "Software"), to deal in the Software without restriction, including
                // without limitation the rights to use, copy, modify, merge, publish,
                // distribute, sublicense, and/or sell copies of the Software, and to permit
                // persons to whom the Software is furnished to do so, subject to the
                // following conditions:
                //
                // The above copyright notice and this permission notice shall be included
                // in all copies or substantial portions of the Software.
                //
                // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
                // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
                // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
                // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
                // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
                // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
                // USE OR OTHER DEALINGS IN THE SOFTWARE.

                var R = typeof Reflect === 'object' ? Reflect : null;
                var ReflectApply =
                    R && typeof R.apply === 'function'
                        ? R.apply
                        : function ReflectApply(target, receiver, args) {
                              return Function.prototype.apply.call(target, receiver, args);
                          };

                var ReflectOwnKeys;
                if (R && typeof R.ownKeys === 'function') {
                    ReflectOwnKeys = R.ownKeys;
                } else if (Object.getOwnPropertySymbols) {
                    ReflectOwnKeys = function ReflectOwnKeys(target) {
                        return Object.getOwnPropertyNames(target).concat(
                            Object.getOwnPropertySymbols(target),
                        );
                    };
                } else {
                    ReflectOwnKeys = function ReflectOwnKeys(target) {
                        return Object.getOwnPropertyNames(target);
                    };
                }

                function ProcessEmitWarning(warning) {
                    if (console && console.warn) console.warn(warning);
                }

                var NumberIsNaN =
                    Number.isNaN ||
                    function NumberIsNaN(value) {
                        return value !== value;
                    };

                function EventEmitter() {
                    EventEmitter.init.call(this);
                }
                module.exports = EventEmitter;
                module.exports.once = once;

                // Backwards-compat with node 0.10.x
                EventEmitter.EventEmitter = EventEmitter;

                EventEmitter.prototype._events = undefined;
                EventEmitter.prototype._eventsCount = 0;
                EventEmitter.prototype._maxListeners = undefined;

                // By default EventEmitters will print a warning if more than 10 listeners are
                // added to it. This is a useful default which helps finding memory leaks.
                var defaultMaxListeners = 10;

                function checkListener(listener) {
                    if (typeof listener !== 'function') {
                        throw new TypeError(
                            'The "listener" argument must be of type Function. Received type ' +
                                typeof listener,
                        );
                    }
                }

                Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
                    enumerable: true,
                    get: function () {
                        return defaultMaxListeners;
                    },
                    set: function (arg) {
                        if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
                            throw new RangeError(
                                'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' +
                                    arg +
                                    '.',
                            );
                        }
                        defaultMaxListeners = arg;
                    },
                });

                EventEmitter.init = function () {
                    if (
                        this._events === undefined ||
                        this._events === Object.getPrototypeOf(this)._events
                    ) {
                        this._events = Object.create(null);
                        this._eventsCount = 0;
                    }

                    this._maxListeners = this._maxListeners || undefined;
                };

                // Obviously not all Emitters should be limited to 10. This function allows
                // that to be increased. Set to zero for unlimited.
                EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
                    if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
                        throw new RangeError(
                            'The value of "n" is out of range. It must be a non-negative number. Received ' +
                                n +
                                '.',
                        );
                    }
                    this._maxListeners = n;
                    return this;
                };

                function _getMaxListeners(that) {
                    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
                    return that._maxListeners;
                }

                EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
                    return _getMaxListeners(this);
                };

                EventEmitter.prototype.emit = function emit(type) {
                    var args = [];
                    for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
                    var doError = type === 'error';

                    var events = this._events;
                    if (events !== undefined) doError = doError && events.error === undefined;
                    else if (!doError) return false;

                    // If there is no 'error' event listener then throw.
                    if (doError) {
                        var er;
                        if (args.length > 0) er = args[0];
                        if (er instanceof Error) {
                            // Note: The comments on the `throw` lines are intentional, they show
                            // up in Node's output if this results in an unhandled exception.
                            throw er; // Unhandled 'error' event
                        }
                        // At least give some kind of context to the user
                        var err = new Error(
                            'Unhandled error.' + (er ? ' (' + er.message + ')' : ''),
                        );
                        err.context = er;
                        throw err; // Unhandled 'error' event
                    }

                    var handler = events[type];

                    if (handler === undefined) return false;

                    if (typeof handler === 'function') {
                        ReflectApply(handler, this, args);
                    } else {
                        var len = handler.length;
                        var listeners = arrayClone(handler, len);
                        for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
                    }

                    return true;
                };

                function _addListener(target, type, listener, prepend) {
                    var m;
                    var events;
                    var existing;

                    checkListener(listener);

                    events = target._events;
                    if (events === undefined) {
                        events = target._events = Object.create(null);
                        target._eventsCount = 0;
                    } else {
                        // To avoid recursion in the case that type === "newListener"! Before
                        // adding it to the listeners, first emit "newListener".
                        if (events.newListener !== undefined) {
                            target.emit(
                                'newListener',
                                type,
                                listener.listener ? listener.listener : listener,
                            );

                            // Re-assign `events` because a newListener handler could have caused the
                            // this._events to be assigned to a new object
                            events = target._events;
                        }
                        existing = events[type];
                    }

                    if (existing === undefined) {
                        // Optimize the case of one listener. Don't need the extra array object.
                        existing = events[type] = listener;
                        ++target._eventsCount;
                    } else {
                        if (typeof existing === 'function') {
                            // Adding the second element, need to change to array.
                            existing = events[type] = prepend
                                ? [listener, existing]
                                : [existing, listener];
                            // If we've already got an array, just append.
                        } else if (prepend) {
                            existing.unshift(listener);
                        } else {
                            existing.push(listener);
                        }

                        // Check for listener leak
                        m = _getMaxListeners(target);
                        if (m > 0 && existing.length > m && !existing.warned) {
                            existing.warned = true;
                            // No error code for this since it is a Warning
                            // eslint-disable-next-line no-restricted-syntax
                            var w = new Error(
                                'Possible EventEmitter memory leak detected. ' +
                                    existing.length +
                                    ' ' +
                                    String(type) +
                                    ' listeners ' +
                                    'added. Use emitter.setMaxListeners() to ' +
                                    'increase limit',
                            );
                            w.name = 'MaxListenersExceededWarning';
                            w.emitter = target;
                            w.type = type;
                            w.count = existing.length;
                            ProcessEmitWarning(w);
                        }
                    }

                    return target;
                }

                EventEmitter.prototype.addListener = function addListener(type, listener) {
                    return _addListener(this, type, listener, false);
                };

                EventEmitter.prototype.on = EventEmitter.prototype.addListener;

                EventEmitter.prototype.prependListener = function prependListener(type, listener) {
                    return _addListener(this, type, listener, true);
                };

                function onceWrapper() {
                    if (!this.fired) {
                        this.target.removeListener(this.type, this.wrapFn);
                        this.fired = true;
                        if (arguments.length === 0) return this.listener.call(this.target);
                        return this.listener.apply(this.target, arguments);
                    }
                }

                function _onceWrap(target, type, listener) {
                    var state = {
                        fired: false,
                        wrapFn: undefined,
                        target: target,
                        type: type,
                        listener: listener,
                    };
                    var wrapped = onceWrapper.bind(state);
                    wrapped.listener = listener;
                    state.wrapFn = wrapped;
                    return wrapped;
                }

                EventEmitter.prototype.once = function once(type, listener) {
                    checkListener(listener);
                    this.on(type, _onceWrap(this, type, listener));
                    return this;
                };

                EventEmitter.prototype.prependOnceListener = function prependOnceListener(
                    type,
                    listener,
                ) {
                    checkListener(listener);
                    this.prependListener(type, _onceWrap(this, type, listener));
                    return this;
                };

                // Emits a 'removeListener' event if and only if the listener was removed.
                EventEmitter.prototype.removeListener = function removeListener(type, listener) {
                    var list, events, position, i, originalListener;

                    checkListener(listener);

                    events = this._events;
                    if (events === undefined) return this;

                    list = events[type];
                    if (list === undefined) return this;

                    if (list === listener || list.listener === listener) {
                        if (--this._eventsCount === 0) this._events = Object.create(null);
                        else {
                            delete events[type];
                            if (events.removeListener)
                                this.emit('removeListener', type, list.listener || listener);
                        }
                    } else if (typeof list !== 'function') {
                        position = -1;

                        for (i = list.length - 1; i >= 0; i--) {
                            if (list[i] === listener || list[i].listener === listener) {
                                originalListener = list[i].listener;
                                position = i;
                                break;
                            }
                        }

                        if (position < 0) return this;

                        if (position === 0) list.shift();
                        else {
                            spliceOne(list, position);
                        }

                        if (list.length === 1) events[type] = list[0];

                        if (events.removeListener !== undefined)
                            this.emit('removeListener', type, originalListener || listener);
                    }

                    return this;
                };

                EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

                EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
                    var listeners, events, i;

                    events = this._events;
                    if (events === undefined) return this;

                    // not listening for removeListener, no need to emit
                    if (events.removeListener === undefined) {
                        if (arguments.length === 0) {
                            this._events = Object.create(null);
                            this._eventsCount = 0;
                        } else if (events[type] !== undefined) {
                            if (--this._eventsCount === 0) this._events = Object.create(null);
                            else delete events[type];
                        }
                        return this;
                    }

                    // emit removeListener for all listeners on all events
                    if (arguments.length === 0) {
                        var keys = Object.keys(events);
                        var key;
                        for (i = 0; i < keys.length; ++i) {
                            key = keys[i];
                            if (key === 'removeListener') continue;
                            this.removeAllListeners(key);
                        }
                        this.removeAllListeners('removeListener');
                        this._events = Object.create(null);
                        this._eventsCount = 0;
                        return this;
                    }

                    listeners = events[type];

                    if (typeof listeners === 'function') {
                        this.removeListener(type, listeners);
                    } else if (listeners !== undefined) {
                        // LIFO order
                        for (i = listeners.length - 1; i >= 0; i--) {
                            this.removeListener(type, listeners[i]);
                        }
                    }

                    return this;
                };

                function _listeners(target, type, unwrap) {
                    var events = target._events;

                    if (events === undefined) return [];

                    var evlistener = events[type];
                    if (evlistener === undefined) return [];

                    if (typeof evlistener === 'function')
                        return unwrap ? [evlistener.listener || evlistener] : [evlistener];

                    return unwrap
                        ? unwrapListeners(evlistener)
                        : arrayClone(evlistener, evlistener.length);
                }

                EventEmitter.prototype.listeners = function listeners(type) {
                    return _listeners(this, type, true);
                };

                EventEmitter.prototype.rawListeners = function rawListeners(type) {
                    return _listeners(this, type, false);
                };

                EventEmitter.listenerCount = function (emitter, type) {
                    if (typeof emitter.listenerCount === 'function') {
                        return emitter.listenerCount(type);
                    } else {
                        return listenerCount.call(emitter, type);
                    }
                };

                EventEmitter.prototype.listenerCount = listenerCount;
                function listenerCount(type) {
                    var events = this._events;

                    if (events !== undefined) {
                        var evlistener = events[type];

                        if (typeof evlistener === 'function') {
                            return 1;
                        } else if (evlistener !== undefined) {
                            return evlistener.length;
                        }
                    }

                    return 0;
                }

                EventEmitter.prototype.eventNames = function eventNames() {
                    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
                };

                function arrayClone(arr, n) {
                    var copy = new Array(n);
                    for (var i = 0; i < n; ++i) copy[i] = arr[i];
                    return copy;
                }

                function spliceOne(list, index) {
                    for (; index + 1 < list.length; index++) list[index] = list[index + 1];
                    list.pop();
                }

                function unwrapListeners(arr) {
                    var ret = new Array(arr.length);
                    for (var i = 0; i < ret.length; ++i) {
                        ret[i] = arr[i].listener || arr[i];
                    }
                    return ret;
                }

                function once(emitter, name) {
                    return new Promise(function (resolve, reject) {
                        function errorListener(err) {
                            emitter.removeListener(name, resolver);
                            reject(err);
                        }

                        function resolver() {
                            if (typeof emitter.removeListener === 'function') {
                                emitter.removeListener('error', errorListener);
                            }
                            resolve([].slice.call(arguments));
                        }

                        eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
                        if (name !== 'error') {
                            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
                        }
                    });
                }

                function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
                    if (typeof emitter.on === 'function') {
                        eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
                    }
                }

                function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
                    if (typeof emitter.on === 'function') {
                        if (flags.once) {
                            emitter.once(name, listener);
                        } else {
                            emitter.on(name, listener);
                        }
                    } else if (typeof emitter.addEventListener === 'function') {
                        // EventTarget does not have `error` event semantics like Node
                        // EventEmitters, we do not listen for `error` events here.
                        emitter.addEventListener(name, function wrapListener(arg) {
                            // IE does not have builtin `{ once: true }` support so we
                            // have to do it manually.
                            if (flags.once) {
                                emitter.removeEventListener(name, wrapListener);
                            }
                            listener(arg);
                        });
                    } else {
                        throw new TypeError(
                            'The "emitter" argument must be of type EventEmitter. Received type ' +
                                typeof emitter,
                        );
                    }
                }

                /***/
            },

            /***/ './src/iframe/index.ts': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', { value: true });
                exports.clearTimeout =
                    exports.postMessage =
                    exports.init =
                    exports.dispose =
                    exports.messagePromises =
                    exports.error =
                    exports.timeout =
                    exports.initPromise =
                    exports.origin =
                    exports.instance =
                        void 0;
                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');
                const utils_1 = __webpack_require__('../utils/lib/index.js');
                const index_1 = __webpack_require__('../connect/lib/index-browser.js');
                const urlUtils_1 = __webpack_require__('../connect/lib/utils/urlUtils.js');
                const inlineStyles_1 = (0, tslib_1.__importDefault)(
                    __webpack_require__('./src/iframe/inlineStyles.ts'),
                );
                exports.initPromise = (0, utils_1.createDeferred)();
                exports.timeout = 0;
                let _messageID = 0;
                exports.messagePromises = {};
                const dispose = () => {
                    if (exports.instance && exports.instance.parentNode) {
                        try {
                            exports.instance.parentNode.removeChild(exports.instance);
                        } catch (e) {}
                    }
                    exports.instance = null;
                    exports.timeout = 0;
                };
                exports.dispose = dispose;
                const handleIframeBlocked = () => {
                    window.clearTimeout(exports.timeout);
                    exports.error = index_1.ERRORS.TypedError('Init_IframeBlocked');
                    (0, exports.dispose)();
                    exports.initPromise.reject(exports.error);
                };
                const injectStyleSheet = () => {
                    if (!exports.instance) {
                        throw index_1.ERRORS.TypedError('Init_IframeBlocked');
                    }
                    const doc = exports.instance.ownerDocument;
                    const head = doc.head || doc.getElementsByTagName('head')[0];
                    const style = document.createElement('style');
                    style.setAttribute('type', 'text/css');
                    style.setAttribute('id', 'TrezorConnectStylesheet');
                    if (style.styleSheet) {
                        style.styleSheet.cssText = inlineStyles_1.default;
                        head.appendChild(style);
                    } else {
                        style.appendChild(document.createTextNode(inlineStyles_1.default));
                        head.append(style);
                    }
                };
                const init = async settings => {
                    exports.initPromise = (0, utils_1.createDeferred)();
                    const existedFrame = document.getElementById('trezorconnect');
                    if (existedFrame) {
                        exports.instance = existedFrame;
                    } else {
                        exports.instance = document.createElement('iframe');
                        exports.instance.frameBorder = '0';
                        exports.instance.width = '0px';
                        exports.instance.height = '0px';
                        exports.instance.style.position = 'absolute';
                        exports.instance.style.display = 'none';
                        exports.instance.style.border = '0px';
                        exports.instance.style.width = '0px';
                        exports.instance.style.height = '0px';
                        exports.instance.id = 'trezorconnect';
                    }
                    let src;
                    if (settings.env === 'web') {
                        const manifestString = settings.manifest
                            ? JSON.stringify(settings.manifest)
                            : 'undefined';
                        const manifest = `version=${settings.version}&manifest=${encodeURIComponent(
                            btoa(JSON.stringify(manifestString)),
                        )}`;
                        src = `${settings.iframeSrc}?${manifest}`;
                    } else {
                        src = settings.iframeSrc;
                    }
                    exports.instance.setAttribute('src', src);
                    if (settings.webusb) {
                        exports.instance.setAttribute('allow', 'usb');
                    }
                    exports.origin = (0, urlUtils_1.getOrigin)(exports.instance.src);
                    exports.timeout = window.setTimeout(() => {
                        exports.initPromise.reject(index_1.ERRORS.TypedError('Init_IframeTimeout'));
                    }, 10000);
                    const onLoad = () => {
                        var _a, _b;
                        if (!exports.instance) {
                            exports.initPromise.reject(
                                index_1.ERRORS.TypedError('Init_IframeBlocked'),
                            );
                            return;
                        }
                        try {
                            const iframeOrigin =
                                (_a = exports.instance.contentWindow) === null || _a === void 0
                                    ? void 0
                                    : _a.location.origin;
                            if (!iframeOrigin || iframeOrigin === 'null') {
                                handleIframeBlocked();
                                return;
                            }
                        } catch (e) {}
                        let extension;
                        if (
                            typeof chrome !== 'undefined' &&
                            chrome.runtime &&
                            typeof chrome.runtime.onConnect !== 'undefined'
                        ) {
                            chrome.runtime.onConnect.addListener(() => {});
                            extension = chrome.runtime.id;
                        }
                        (_b = exports.instance.contentWindow) === null || _b === void 0
                            ? void 0
                            : _b.postMessage(
                                  {
                                      type: index_1.IFRAME.INIT,
                                      payload: {
                                          settings,
                                          extension,
                                      },
                                  },
                                  exports.origin,
                              );
                        exports.instance.onload = undefined;
                    };
                    if (exports.instance.attachEvent) {
                        exports.instance.attachEvent('onload', onLoad);
                    } else {
                        exports.instance.onload = onLoad;
                    }
                    if (document.body) {
                        document.body.appendChild(exports.instance);
                        injectStyleSheet();
                    }
                    try {
                        await exports.initPromise.promise;
                    } catch (e) {
                        if (exports.instance) {
                            if (exports.instance.parentNode) {
                                exports.instance.parentNode.removeChild(exports.instance);
                            }
                            exports.instance = null;
                        }
                        throw e;
                    } finally {
                        window.clearTimeout(exports.timeout);
                        exports.timeout = 0;
                    }
                };
                exports.init = init;
                const postMessage = (message, usePromise = true) => {
                    var _a, _b;
                    if (!exports.instance) {
                        throw index_1.ERRORS.TypedError('Init_IframeBlocked');
                    }
                    if (usePromise) {
                        _messageID++;
                        message.id = _messageID;
                        exports.messagePromises[_messageID] = (0, utils_1.createDeferred)();
                        const { promise } = exports.messagePromises[_messageID];
                        (_a = exports.instance.contentWindow) === null || _a === void 0
                            ? void 0
                            : _a.postMessage(message, exports.origin);
                        return promise;
                    }
                    (_b = exports.instance.contentWindow) === null || _b === void 0
                        ? void 0
                        : _b.postMessage(message, exports.origin);
                    return null;
                };
                exports.postMessage = postMessage;
                const clearTimeout = () => {
                    window.clearTimeout(exports.timeout);
                };
                exports.clearTimeout = clearTimeout;

                /***/
            },

            /***/ './src/iframe/inlineStyles.ts': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', { value: true });
                const css =
                    '.trezorconnect-container{position:fixed!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-orient:vertical!important;-webkit-box-direction:normal!important;-webkit-flex-direction:column!important;-ms-flex-direction:column!important;flex-direction:column!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important;z-index:10000!important;width:100%!important;height:100%!important;top:0!important;left:0!important;background:rgba(0,0,0,.35)!important;overflow:auto!important;padding:20px!important;margin:0!important}.trezorconnect-container .trezorconnect-window{position:relative!important;display:block!important;width:370px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif!important;margin:auto!important;border-radius:3px!important;background-color:#fff!important;text-align:center!important;overflow:hidden!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head{text-align:left;padding:12px 24px!important;display:-webkit-box!important;display:-webkit-flex!important;display:-ms-flexbox!important;display:flex!important;-webkit-box-align:center!important;-webkit-align-items:center!important;-ms-flex-align:center!important;align-items:center!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-logo{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close{cursor:pointer!important;height:24px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close svg{fill:#757575;-webkit-transition:fill .3s ease-in-out!important;transition:fill .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-head .trezorconnect-close:hover svg{fill:#494949}.trezorconnect-container .trezorconnect-window .trezorconnect-body{padding:24px 24px 32px!important;background:#FBFBFB!important;border-top:1px solid #EBEBEB}.trezorconnect-container .trezorconnect-window .trezorconnect-body h3{color:#505050!important;font-size:16px!important;font-weight:500!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body p{margin:8px 0 24px!important;font-weight:400!important;color:#A9A9A9!important;font-size:12px!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button{width:100%!important;padding:12px 24px!important;margin:0!important;border-radius:3px!important;font-size:14px!important;font-weight:300!important;cursor:pointer!important;background:#01B757!important;color:#fff!important;border:0!important;-webkit-transition:background-color .3s ease-in-out!important;transition:background-color .3s ease-in-out!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:hover{background-color:#00AB51!important}.trezorconnect-container .trezorconnect-window .trezorconnect-body button:active{background-color:#009546!important}/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImlucHV0IiwiJHN0ZGluIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWNBLHlCQUNJLFNBQUEsZ0JBQ0EsUUFBQSxzQkFDQSxRQUFBLHVCQUNBLFFBQUEsc0JBRUEsUUFBQSxlQUNBLG1CQUFBLG1CQUNBLHNCQUFBLGlCQUNBLHVCQUFBLGlCQUNBLG1CQUFBLGlCQUNBLGVBQUEsaUJBRUEsa0JBQUEsaUJBQ0Esb0JBQUEsaUJBQ0EsZUFBQSxpQkNmTSxZQUFhLGlCREFyQixRQUFTLGdCQWtCSCxNQUFBLGVBQ0EsT0FBQSxlQUNBLElBQUEsWUFDQSxLQUFBLFlBQ0EsV0FBQSwwQkFDQSxTQUFBLGVBQ0EsUUFBQSxlQUNBLE9BQUEsWUNkUiwrQ0RYRSxTQUFVLG1CQTZCQSxRQUFBLGdCQUNBLE1BQUEsZ0JBQ0EsWUFBQSxjQUFBLG1CQUFBLFdBQUEsT0FBQSxpQkFBQSxNQUFBLHFCQUNBLE9BQUEsZUNmVixjQUFlLGNEakJmLGlCQWlCRSxlQWtCWSxXQUFBLGlCQ2ZkLFNBQVUsaUJEbUJJLG1FQUNBLFdBQUEsS0NoQmQsUUFBUyxLQUFLLGVEeEJkLFFBQVMsc0JBMENTLFFBQUEsdUJBQ0EsUUFBQSxzQkNmbEIsUUFBUyxlRGlCSyxrQkE1QlosaUJBOEJvQixvQkFBQSxpQkNoQmxCLGVBQWdCLGlCRC9CWixZQWlCTixpQkFzQ1EsdUZBQ0EsaUJBQUEsRUNwQlYsYUFBYyxFRHBDVixTQUFVLEVBMkRBLEtBQUEsRUFFQSx3RkNwQmQsT0FBUSxrQkR6Q1IsT0FBUSxlQWlFTSw0RkFDQSxLQUFBLFFBQ0EsbUJBQUEsS0FBQSxJQUFBLHNCQ3BCZCxXQUFZLEtBQUssSUFBSyxzQkR3QlIsa0dBQ0EsS0FBQSxRQUVBLG1FQUNBLFFBQUEsS0FBQSxLQUFBLGVBQ0EsV0FBQSxrQkFDQSxXQUFBLElBQUEsTUFBQSxRQUVBLHNFQUNBLE1BQUEsa0JBQ0EsVUFBQSxlQ3JCZCxZQUFhLGNEd0JLLHFFQ3JCbEIsT0FBUSxJQUFJLEVBQUksZUR3QkYsWUFBQSxjQUNJLE1BQUEsa0JDdEJsQixVQUFXLGVBRWIsMEVBQ0UsTUFBTyxlQUNQLFFBQVMsS0FBSyxlQUNkLE9BQVEsWUFDUixjQUFlLGNBQ2YsVUFBVyxlQUNYLFlBQWEsY0FDYixPQUFRLGtCQUNSLFdBQVksa0JBQ1osTUFBTyxlQUNQLE9BQVEsWUFDUixtQkFBb0IsaUJBQWlCLElBQUssc0JBQzFDLFdBQVksaUJBQWlCLElBQUssc0JBRXBDLGdGQUNFLGlCQUFrQixrQkFFcEIsaUZBQ0UsaUJBQWtCIn0= */';
                exports['default'] = css;

                /***/
            },

            /***/ './src/index.ts': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', { value: true });
                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');
                const events_1 = (0, tslib_1.__importDefault)(
                    __webpack_require__('../../node_modules/events/events.js'),
                );
                const TrezorConnectBrowser = (0, tslib_1.__importStar)(
                    __webpack_require__('../connect/lib/index-browser.js'),
                );
                const factory_1 = __webpack_require__('../connect/lib/factory.js');
                const ConnectSettings_1 = __webpack_require__(
                    '../connect/lib/data/ConnectSettings.js',
                );
                const debug_1 = __webpack_require__('../connect/lib/utils/debug.js');
                const iframe = (0, tslib_1.__importStar)(
                    __webpack_require__('./src/iframe/index.ts'),
                );
                const popup = (0, tslib_1.__importStar)(
                    __webpack_require__('./src/popup/index.ts'),
                );
                const {
                    POPUP,
                    IFRAME,
                    UI,
                    ERRORS,
                    UI_EVENT,
                    DEVICE_EVENT,
                    RESPONSE_EVENT,
                    TRANSPORT_EVENT,
                    BLOCKCHAIN_EVENT,
                    TRANSPORT,
                    parseMessage,
                    UiMessage,
                    ErrorMessage,
                } = TrezorConnectBrowser;
                const eventEmitter = new events_1.default();
                const _log = (0, debug_1.initLog)('[trezor-connect.js]');
                let _settings = (0, ConnectSettings_1.parse)();
                let _popupManager;
                const initPopupManager = () => {
                    const pm = new popup.PopupManager(_settings);
                    pm.on(POPUP.CLOSED, error => {
                        iframe.postMessage(
                            {
                                type: POPUP.CLOSED,
                                payload: error ? { error } : null,
                            },
                            false,
                        );
                    });
                    return pm;
                };
                const manifest = data => {
                    _settings = (0, ConnectSettings_1.parse)(
                        Object.assign(Object.assign({}, _settings), { manifest: data }),
                    );
                };
                const dispose = () => {
                    eventEmitter.removeAllListeners();
                    iframe.dispose();
                    _settings = (0, ConnectSettings_1.parse)();
                    if (_popupManager) {
                        _popupManager.close();
                    }
                };
                const cancel = error => {
                    if (_popupManager) {
                        _popupManager.emit(POPUP.CLOSED, error);
                    }
                };
                const handleMessage = messageEvent => {
                    if (messageEvent.origin !== iframe.origin) return;
                    const message = parseMessage(messageEvent.data);
                    const id = message.id || 0;
                    _log.log('handleMessage', message);
                    switch (message.event) {
                        case RESPONSE_EVENT:
                            if (iframe.messagePromises[id]) {
                                iframe.messagePromises[id].resolve({
                                    id,
                                    success: message.success,
                                    payload: message.payload,
                                });
                                delete iframe.messagePromises[id];
                            } else {
                                _log.warn(`Unknown message id ${id}`);
                            }
                            break;
                        case DEVICE_EVENT:
                            eventEmitter.emit(message.event, message);
                            eventEmitter.emit(message.type, message.payload);
                            break;
                        case TRANSPORT_EVENT:
                            eventEmitter.emit(message.event, message);
                            eventEmitter.emit(message.type, message.payload);
                            break;
                        case BLOCKCHAIN_EVENT:
                            eventEmitter.emit(message.event, message);
                            eventEmitter.emit(message.type, message.payload);
                            break;
                        case UI_EVENT:
                            if (message.type === IFRAME.BOOTSTRAP) {
                                iframe.clearTimeout();
                                break;
                            }
                            if (message.type === IFRAME.LOADED) {
                                iframe.initPromise.resolve();
                            }
                            if (message.type === IFRAME.ERROR) {
                                iframe.initPromise.reject(message.payload.error);
                            }
                            eventEmitter.emit(message.event, message);
                            eventEmitter.emit(message.type, message.payload);
                            break;
                        default:
                            _log.log('Undefined message', message.event, messageEvent);
                    }
                };
                const init = async (settings = {}) => {
                    if (iframe.instance) {
                        throw ERRORS.TypedError('Init_AlreadyInitialized');
                    }
                    _settings = (0, ConnectSettings_1.parse)(
                        Object.assign(Object.assign({}, _settings), settings),
                    );
                    if (!_settings.manifest) {
                        throw ERRORS.TypedError('Init_ManifestMissing');
                    }
                    if (_settings.lazyLoad) {
                        _settings.lazyLoad = false;
                        return;
                    }
                    if (!_popupManager) {
                        _popupManager = initPopupManager();
                    }
                    _log.enabled = !!_settings.debug;
                    window.addEventListener('message', handleMessage);
                    window.addEventListener('unload', dispose);
                    await iframe.init(_settings);
                };
                const call = async params => {
                    if (!iframe.instance && !iframe.timeout) {
                        _settings = (0, ConnectSettings_1.parse)(_settings);
                        if (!_settings.manifest) {
                            return ErrorMessage(ERRORS.TypedError('Init_ManifestMissing'));
                        }
                        if (!_popupManager) {
                            _popupManager = initPopupManager();
                        }
                        _popupManager.request(true);
                        try {
                            await init(_settings);
                        } catch (error) {
                            if (_popupManager) {
                                if (
                                    ['Init_IframeBlocked', 'Init_IframeTimeout'].includes(
                                        error.code,
                                    )
                                ) {
                                    _popupManager.postMessage(UiMessage(UI.IFRAME_FAILURE));
                                } else {
                                    _popupManager.close();
                                }
                            }
                            return ErrorMessage(error);
                        }
                    }
                    if (iframe.timeout) {
                        return ErrorMessage(ERRORS.TypedError('Init_ManifestMissing'));
                    }
                    if (iframe.error) {
                        return ErrorMessage(iframe.error);
                    }
                    if (_settings.popup && _popupManager) {
                        _popupManager.request();
                    }
                    try {
                        const response = await iframe.postMessage({
                            type: IFRAME.CALL,
                            payload: params,
                        });
                        if (response) {
                            if (
                                !response.success &&
                                response.payload.code !== 'Device_CallInProgress' &&
                                _popupManager
                            ) {
                                _popupManager.unlock();
                            }
                            return response;
                        }
                        if (_popupManager) {
                            _popupManager.unlock();
                        }
                        return ErrorMessage(ERRORS.TypedError('Method_NoResponse'));
                    } catch (error) {
                        _log.error('__call error', error);
                        if (_popupManager) {
                            _popupManager.close();
                        }
                        return ErrorMessage(error);
                    }
                };
                const customMessageResponse = payload => {
                    iframe.postMessage({
                        event: UI_EVENT,
                        type: UI.CUSTOM_MESSAGE_RESPONSE,
                        payload,
                    });
                };
                const uiResponse = response => {
                    if (!iframe.instance) {
                        throw ERRORS.TypedError('Init_NotInitialized');
                    }
                    const { type, payload } = response;
                    iframe.postMessage({ event: UI_EVENT, type, payload });
                };
                const renderWebUSBButton = _className => {};
                const getSettings = () => {
                    if (!iframe.instance) {
                        return Promise.resolve(
                            ErrorMessage(ERRORS.TypedError('Init_NotInitialized')),
                        );
                    }
                    return call({ method: 'getSettings' });
                };
                const customMessage = async params => {
                    if (!iframe.instance) {
                        throw ERRORS.TypedError('Init_NotInitialized');
                    }
                    if (typeof params.callback !== 'function') {
                        return ErrorMessage(ERRORS.TypedError('Method_CustomMessage_Callback'));
                    }
                    const { callback } = params;
                    const customMessageListener = async event => {
                        const { data } = event;
                        if (data && data.type === UI.CUSTOM_MESSAGE_REQUEST) {
                            const payload = await callback(data.payload);
                            if (payload) {
                                customMessageResponse(payload);
                            } else {
                                customMessageResponse({ message: 'release' });
                            }
                        }
                    };
                    window.addEventListener('message', customMessageListener, false);
                    const response = await call(
                        Object.assign(Object.assign({ method: 'customMessage' }, params), {
                            callback: null,
                        }),
                    );
                    window.removeEventListener('message', customMessageListener);
                    return response;
                };
                const requestLogin = async params => {
                    if (!iframe.instance) {
                        throw ERRORS.TypedError('Init_NotInitialized');
                    }
                    if (typeof params.callback === 'function') {
                        const { callback } = params;
                        const loginChallengeListener = async event => {
                            const { data } = event;
                            if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                                try {
                                    const payload = await callback();
                                    iframe.postMessage({
                                        event: UI_EVENT,
                                        type: UI.LOGIN_CHALLENGE_RESPONSE,
                                        payload,
                                    });
                                } catch (error) {
                                    iframe.postMessage({
                                        event: UI_EVENT,
                                        type: UI.LOGIN_CHALLENGE_RESPONSE,
                                        payload: error.message,
                                    });
                                }
                            }
                        };
                        window.addEventListener('message', loginChallengeListener, false);
                        const response = await call(
                            Object.assign(Object.assign({ method: 'requestLogin' }, params), {
                                asyncChallenge: true,
                                callback: null,
                            }),
                        );
                        window.removeEventListener('message', loginChallengeListener);
                        return response;
                    }
                    return call(Object.assign({ method: 'requestLogin' }, params));
                };
                const disableWebUSB = () => {
                    if (!iframe.instance) {
                        throw ERRORS.TypedError('Init_NotInitialized');
                    }
                    iframe.postMessage({
                        event: UI_EVENT,
                        type: TRANSPORT.DISABLE_WEBUSB,
                    });
                };
                const TrezorConnect = (0, factory_1.factory)({
                    eventEmitter,
                    manifest,
                    init,
                    call: call,
                    getSettings,
                    customMessage,
                    requestLogin,
                    uiResponse,
                    renderWebUSBButton,
                    disableWebUSB,
                    cancel,
                    dispose,
                });
                exports['default'] = TrezorConnect;
                (0, tslib_1.__exportStar)(
                    __webpack_require__('../connect/lib/exports.js'),
                    exports,
                );

                /***/
            },

            /***/ './src/popup/index.ts': /***/ (
                __unused_webpack_module,
                exports,
                __webpack_require__,
            ) => {
                Object.defineProperty(exports, '__esModule', { value: true });
                exports.PopupManager = void 0;
                const tslib_1 = __webpack_require__('../../node_modules/tslib/tslib.es6.js');
                const events_1 = (0, tslib_1.__importDefault)(
                    __webpack_require__('../../node_modules/events/events.js'),
                );
                const utils_1 = __webpack_require__('../utils/lib/index.js');
                const index_1 = __webpack_require__('../connect/lib/index-browser.js');
                const urlUtils_1 = __webpack_require__('../connect/lib/utils/urlUtils.js');
                const showPopupRequest_1 = __webpack_require__('./src/popup/showPopupRequest.ts');
                const POPUP_REQUEST_TIMEOUT = 850;
                const POPUP_CLOSE_INTERVAL = 500;
                const POPUP_OPEN_TIMEOUT = 3000;
                class PopupManager extends events_1.default {
                    constructor(settings) {
                        super();
                        this.locked = false;
                        this.requestTimeout = 0;
                        this.closeInterval = 0;
                        this.extensionTabId = 0;
                        this.settings = settings;
                        this.origin = (0, urlUtils_1.getOrigin)(settings.popupSrc);
                        this.handleMessage = this.handleMessage.bind(this);
                        this.iframeHandshake = (0, utils_1.createDeferred)(index_1.IFRAME.LOADED);
                        if (this.settings.env === 'webextension') {
                            this.handleExtensionConnect = this.handleExtensionConnect.bind(this);
                            this.handleExtensionMessage = this.handleExtensionMessage.bind(this);
                            chrome.runtime.onConnect.addListener(this.handleExtensionConnect);
                        }
                        window.addEventListener('message', this.handleMessage, false);
                    }
                    request(lazyLoad = false) {
                        if (this.locked) {
                            if (this._window) {
                                if (this.settings.env === 'webextension') {
                                    chrome.tabs.update(this._window.id, { active: true });
                                } else {
                                    this._window.focus();
                                }
                            }
                            return;
                        }
                        const openFn = this.open.bind(this);
                        this.locked = true;
                        if (!this.settings.supportedBrowser) {
                            openFn();
                        } else {
                            const timeout =
                                lazyLoad || this.settings.env === 'webextension'
                                    ? 1
                                    : POPUP_REQUEST_TIMEOUT;
                            this.requestTimeout = window.setTimeout(() => {
                                this.requestTimeout = 0;
                                openFn(lazyLoad);
                            }, timeout);
                        }
                    }
                    cancel() {
                        this.close();
                    }
                    unlock() {
                        this.locked = false;
                    }
                    open(lazyLoad) {
                        const src = this.settings.popupSrc;
                        if (!this.settings.supportedBrowser) {
                            this.openWrapper(`${src}#unsupported`);
                            return;
                        }
                        this.popupPromise = (0, utils_1.createDeferred)(index_1.POPUP.LOADED);
                        this.openWrapper(lazyLoad ? `${src}#loading` : src);
                        this.closeInterval = window.setInterval(() => {
                            if (!this._window) return;
                            if (this.settings.env === 'webextension') {
                                chrome.tabs.get(this._window.id, tab => {
                                    if (!tab) {
                                        this.close();
                                        this.emit(index_1.POPUP.CLOSED);
                                    }
                                });
                            } else if (this._window.closed) {
                                this.close();
                                this.emit(index_1.POPUP.CLOSED);
                            }
                        }, POPUP_CLOSE_INTERVAL);
                        this.openTimeout = setTimeout(() => {
                            this.close();
                            (0, showPopupRequest_1.showPopupRequest)(this.open.bind(this), () => {
                                this.emit(index_1.POPUP.CLOSED);
                            });
                        }, POPUP_OPEN_TIMEOUT);
                    }
                    openWrapper(url) {
                        if (this.settings.env === 'webextension') {
                            chrome.windows.getCurrent(currentWindow => {
                                if (currentWindow.type !== 'normal') {
                                    chrome.windows.create({ url }, newWindow => {
                                        chrome.tabs.query(
                                            {
                                                windowId:
                                                    newWindow === null || newWindow === void 0
                                                        ? void 0
                                                        : newWindow.id,
                                                active: true,
                                            },
                                            tabs => {
                                                this._window = tabs[0];
                                            },
                                        );
                                    });
                                } else {
                                    chrome.tabs.query(
                                        {
                                            currentWindow: true,
                                            active: true,
                                        },
                                        tabs => {
                                            this.extensionTabId = tabs[0].id;
                                            chrome.tabs.create(
                                                {
                                                    url,
                                                    index: tabs[0].index + 1,
                                                },
                                                tab => {
                                                    this._window = tab;
                                                },
                                            );
                                        },
                                    );
                                }
                            });
                        } else if (this.settings.env === 'electron') {
                            this._window = window.open(url, 'modal');
                        } else {
                            this._window = window.open('', '_blank');
                            if (this._window) {
                                this._window.location.href = url;
                            }
                        }
                    }
                    handleExtensionConnect(port) {
                        var _a, _b;
                        if (port.name !== 'trezor-connect') return;
                        if (
                            !this._window ||
                            (this._window &&
                                this._window.id !==
                                    ((_b =
                                        (_a = port.sender) === null || _a === void 0
                                            ? void 0
                                            : _a.tab) === null || _b === void 0
                                        ? void 0
                                        : _b.id))
                        ) {
                            port.disconnect();
                            return;
                        }
                        if (this.openTimeout) clearTimeout(this.openTimeout);
                        this.extensionPort = port;
                        this.extensionPort.onMessage.addListener(this.handleExtensionMessage);
                    }
                    handleExtensionMessage(message) {
                        if (!this.extensionPort) return;
                        const port = this.extensionPort;
                        const { data } = message;
                        if (!data || typeof data !== 'object') return;
                        if (data.type === index_1.POPUP.ERROR) {
                            const errorMessage =
                                data.payload && typeof data.payload.error === 'string'
                                    ? data.payload.error
                                    : null;
                            this.emit(
                                index_1.POPUP.CLOSED,
                                errorMessage ? `Popup error: ${errorMessage}` : null,
                            );
                            this.close();
                        } else if (data.type === index_1.POPUP.LOADED) {
                            if (this.popupPromise) {
                                this.popupPromise.resolve();
                            }
                            this.iframeHandshake.promise.then(useBroadcastChannel => {
                                port.postMessage({
                                    type: index_1.POPUP.INIT,
                                    payload: {
                                        settings: this.settings,
                                        useBroadcastChannel,
                                    },
                                });
                            });
                        } else if (data.type === index_1.POPUP.EXTENSION_USB_PERMISSIONS) {
                            chrome.tabs.query(
                                {
                                    currentWindow: true,
                                    active: true,
                                },
                                tabs => {
                                    chrome.tabs.create(
                                        {
                                            url: 'trezor-usb-permissions.html',
                                            index: tabs[0].index + 1,
                                        },
                                        _tab => {},
                                    );
                                },
                            );
                        } else if (data.type === index_1.POPUP.CLOSE_WINDOW) {
                            this.emit(index_1.POPUP.CLOSED);
                            this.close();
                        }
                    }
                    handleMessage(message) {
                        const { data } = message;
                        if (
                            (0, urlUtils_1.getOrigin)(message.origin) !== this.origin ||
                            !data ||
                            typeof data !== 'object'
                        )
                            return;
                        if (data.type === index_1.IFRAME.LOADED) {
                            const useBroadcastChannel =
                                data.payload &&
                                typeof data.payload.useBroadcastChannel === 'boolean'
                                    ? data.payload.useBroadcastChannel
                                    : false;
                            this.iframeHandshake.resolve(useBroadcastChannel);
                        } else if (data.type === index_1.POPUP.BOOTSTRAP) {
                            if (this.openTimeout) clearTimeout(this.openTimeout);
                        } else if (data.type === index_1.POPUP.ERROR && this._window) {
                            const errorMessage =
                                data.payload && typeof data.payload.error === 'string'
                                    ? data.payload.error
                                    : null;
                            this.emit(
                                index_1.POPUP.CLOSED,
                                errorMessage ? `Popup error: ${errorMessage}` : null,
                            );
                            this.close();
                        } else if (data.type === index_1.POPUP.LOADED) {
                            if (this.popupPromise) {
                                this.popupPromise.resolve();
                            }
                            this.iframeHandshake.promise.then(useBroadcastChannel => {
                                this._window.postMessage(
                                    {
                                        type: index_1.POPUP.INIT,
                                        payload: {
                                            settings: this.settings,
                                            useBroadcastChannel,
                                        },
                                    },
                                    this.origin,
                                );
                            });
                        } else if (
                            data.type === index_1.POPUP.CANCEL_POPUP_REQUEST ||
                            data.type === index_1.UI.CLOSE_UI_WINDOW
                        ) {
                            this.close();
                        }
                    }
                    close() {
                        this.locked = false;
                        this.popupPromise = undefined;
                        if (this.requestTimeout) {
                            window.clearTimeout(this.requestTimeout);
                            this.requestTimeout = 0;
                        }
                        if (this.openTimeout) {
                            clearTimeout(this.openTimeout);
                            this.openTimeout = undefined;
                        }
                        if (this.closeInterval) {
                            window.clearInterval(this.closeInterval);
                            this.closeInterval = 0;
                        }
                        if (this.extensionPort) {
                            this.extensionPort.disconnect();
                            this.extensionPort = undefined;
                        }
                        if (this.extensionTabId) {
                            chrome.tabs.update(this.extensionTabId, { active: true });
                            this.extensionTabId = 0;
                        }
                        if (this._window) {
                            if (this.settings.env === 'webextension') {
                                let _e = chrome.runtime.lastError;
                                chrome.tabs.remove(this._window.id, () => {
                                    _e = chrome.runtime.lastError;
                                });
                            } else {
                                this._window.close();
                            }
                            this._window = null;
                        }
                    }
                    async postMessage(message) {
                        if (
                            !this._window &&
                            message.type !== index_1.UI.REQUEST_UI_WINDOW &&
                            this.openTimeout
                        ) {
                            this.close();
                            (0, showPopupRequest_1.showPopupRequest)(this.open.bind(this), () => {
                                this.emit(index_1.POPUP.CLOSED);
                            });
                            return;
                        }
                        if (this.popupPromise) {
                            await this.popupPromise.promise;
                        }
                        if (this._window) {
                            this._window.postMessage(message, this.origin);
                        }
                    }
                }
                exports.PopupManager = PopupManager;

                /***/
            },

            /***/ './src/popup/showPopupRequest.ts': /***/ (__unused_webpack_module, exports) => {
                Object.defineProperty(exports, '__esModule', { value: true });
                exports.showPopupRequest = void 0;
                const LAYER_ID = 'TrezorConnectInteractionLayer';
                const HTML = `
    <div class="trezorconnect-container" id="${LAYER_ID}">
        <div class="trezorconnect-window">
            <div class="trezorconnect-head">
                <svg class="trezorconnect-logo" x="0px" y="0px" viewBox="0 0 163.7 41.9" width="78px" height="20px" preserveAspectRatio="xMinYMin meet">
                    <polygon points="101.1,12.8 118.2,12.8 118.2,17.3 108.9,29.9 118.2,29.9 118.2,35.2 101.1,35.2 101.1,30.7 110.4,18.1 101.1,18.1"/>
                    <path d="M158.8,26.9c2.1-0.8,4.3-2.9,4.3-6.6c0-4.5-3.1-7.4-7.7-7.4h-10.5v22.3h5.8v-7.5h2.2l4.1,7.5h6.7L158.8,26.9z M154.7,22.5 h-4V18h4c1.5,0,2.5,0.9,2.5,2.2C157.2,21.6,156.2,22.5,154.7,22.5z"/>
                    <path d="M130.8,12.5c-6.8,0-11.6,4.9-11.6,11.5s4.9,11.5,11.6,11.5s11.7-4.9,11.7-11.5S137.6,12.5,130.8,12.5z M130.8,30.3 c-3.4,0-5.7-2.6-5.7-6.3c0-3.8,2.3-6.3,5.7-6.3c3.4,0,5.8,2.6,5.8,6.3C136.6,27.7,134.2,30.3,130.8,30.3z"/>
                    <polygon points="82.1,12.8 98.3,12.8 98.3,18 87.9,18 87.9,21.3 98,21.3 98,26.4 87.9,26.4 87.9,30 98.3,30 98.3,35.2 82.1,35.2 "/>
                    <path d="M24.6,9.7C24.6,4.4,20,0,14.4,0S4.2,4.4,4.2,9.7v3.1H0v22.3h0l14.4,6.7l14.4-6.7h0V12.9h-4.2V9.7z M9.4,9.7 c0-2.5,2.2-4.5,5-4.5s5,2,5,4.5v3.1H9.4V9.7z M23,31.5l-8.6,4l-8.6-4V18.1H23V31.5z"/>
                    <path d="M79.4,20.3c0-4.5-3.1-7.4-7.7-7.4H61.2v22.3H67v-7.5h2.2l4.1,7.5H80l-4.9-8.3C77.2,26.1,79.4,24,79.4,20.3z M71,22.5h-4V18 h4c1.5,0,2.5,0.9,2.5,2.2C73.5,21.6,72.5,22.5,71,22.5z"/>
                    <polygon points="40.5,12.8 58.6,12.8 58.6,18.1 52.4,18.1 52.4,35.2 46.6,35.2 46.6,18.1 40.5,18.1 "/>
                </svg>
                <div class="trezorconnect-close">
                    <svg x="0px" y="0px" viewBox="24 24 60 60" width="24px" height="24px" preserveAspectRatio="xMinYMin meet">
                        <polygon class="st0" points="40,67.9 42.1,70 55,57.1 67.9,70 70,67.9 57.1,55 70,42.1 67.9,40 55,52.9 42.1,40 40,42.1 52.9,55 "/>
                    </svg>
                </div>
            </div>
            <div class="trezorconnect-body">
                <h3>Popup was blocked</h3>
                <p>Please click to “Continue” to open popup manually</p>
                <button class="trezorconnect-open">Continue</button>
            </div>
        </div>
    </div>
`;
                const showPopupRequest = (open, cancel) => {
                    if (document.getElementById(LAYER_ID)) {
                        return;
                    }
                    const div = document.createElement('div');
                    div.id = LAYER_ID;
                    div.className = 'trezorconnect-container';
                    div.innerHTML = HTML;
                    if (document.body) {
                        document.body.appendChild(div);
                    }
                    const button = div.getElementsByClassName('trezorconnect-open')[0];
                    button.onclick = () => {
                        open();
                        if (document.body) {
                            document.body.removeChild(div);
                        }
                    };
                    const close = div.getElementsByClassName('trezorconnect-close')[0];
                    close.onclick = () => {
                        cancel();
                        if (document.body) {
                            document.body.removeChild(div);
                        }
                    };
                };
                exports.showPopupRequest = showPopupRequest;

                /***/
            },

            /***/ '../../node_modules/tslib/tslib.es6.js': /***/ (
                __unused_webpack_module,
                __webpack_exports__,
                __webpack_require__,
            ) => {
                __webpack_require__.r(__webpack_exports__);
                /* harmony export */ __webpack_require__.d(__webpack_exports__, {
                    /* harmony export */ __assign: () => /* binding */ __assign,
                    /* harmony export */ __asyncDelegator: () => /* binding */ __asyncDelegator,
                    /* harmony export */ __asyncGenerator: () => /* binding */ __asyncGenerator,
                    /* harmony export */ __asyncValues: () => /* binding */ __asyncValues,
                    /* harmony export */ __await: () => /* binding */ __await,
                    /* harmony export */ __awaiter: () => /* binding */ __awaiter,
                    /* harmony export */ __classPrivateFieldGet: () =>
                        /* binding */ __classPrivateFieldGet,
                    /* harmony export */ __classPrivateFieldSet: () =>
                        /* binding */ __classPrivateFieldSet,
                    /* harmony export */ __createBinding: () => /* binding */ __createBinding,
                    /* harmony export */ __decorate: () => /* binding */ __decorate,
                    /* harmony export */ __exportStar: () => /* binding */ __exportStar,
                    /* harmony export */ __extends: () => /* binding */ __extends,
                    /* harmony export */ __generator: () => /* binding */ __generator,
                    /* harmony export */ __importDefault: () => /* binding */ __importDefault,
                    /* harmony export */ __importStar: () => /* binding */ __importStar,
                    /* harmony export */ __makeTemplateObject: () =>
                        /* binding */ __makeTemplateObject,
                    /* harmony export */ __metadata: () => /* binding */ __metadata,
                    /* harmony export */ __param: () => /* binding */ __param,
                    /* harmony export */ __read: () => /* binding */ __read,
                    /* harmony export */ __rest: () => /* binding */ __rest,
                    /* harmony export */ __spread: () => /* binding */ __spread,
                    /* harmony export */ __spreadArray: () => /* binding */ __spreadArray,
                    /* harmony export */ __spreadArrays: () => /* binding */ __spreadArrays,
                    /* harmony export */ __values: () => /* binding */ __values,
                    /* harmony export */
                });
                /*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
                /* global Reflect, Promise */

                var extendStatics = function (d, b) {
                    extendStatics =
                        Object.setPrototypeOf ||
                        ({ __proto__: [] } instanceof Array &&
                            function (d, b) {
                                d.__proto__ = b;
                            }) ||
                        function (d, b) {
                            for (var p in b)
                                if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
                        };
                    return extendStatics(d, b);
                };

                function __extends(d, b) {
                    if (typeof b !== 'function' && b !== null)
                        throw new TypeError(
                            'Class extends value ' + String(b) + ' is not a constructor or null',
                        );
                    extendStatics(d, b);
                    function __() {
                        this.constructor = d;
                    }
                    d.prototype =
                        b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
                }

                var __assign = function () {
                    __assign =
                        Object.assign ||
                        function __assign(t) {
                            for (var s, i = 1, n = arguments.length; i < n; i++) {
                                s = arguments[i];
                                for (var p in s)
                                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                            }
                            return t;
                        };
                    return __assign.apply(this, arguments);
                };

                function __rest(s, e) {
                    var t = {};
                    for (var p in s)
                        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                            t[p] = s[p];
                    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
                        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                            if (
                                e.indexOf(p[i]) < 0 &&
                                Object.prototype.propertyIsEnumerable.call(s, p[i])
                            )
                                t[p[i]] = s[p[i]];
                        }
                    return t;
                }

                function __decorate(decorators, target, key, desc) {
                    var c = arguments.length,
                        r =
                            c < 3
                                ? target
                                : desc === null
                                ? (desc = Object.getOwnPropertyDescriptor(target, key))
                                : desc,
                        d;
                    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
                        r = Reflect.decorate(decorators, target, key, desc);
                    else
                        for (var i = decorators.length - 1; i >= 0; i--)
                            if ((d = decorators[i]))
                                r =
                                    (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) ||
                                    r;
                    return c > 3 && r && Object.defineProperty(target, key, r), r;
                }

                function __param(paramIndex, decorator) {
                    return function (target, key) {
                        decorator(target, key, paramIndex);
                    };
                }

                function __metadata(metadataKey, metadataValue) {
                    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
                        return Reflect.metadata(metadataKey, metadataValue);
                }

                function __awaiter(thisArg, _arguments, P, generator) {
                    function adopt(value) {
                        return value instanceof P
                            ? value
                            : new P(function (resolve) {
                                  resolve(value);
                              });
                    }
                    return new (P || (P = Promise))(function (resolve, reject) {
                        function fulfilled(value) {
                            try {
                                step(generator.next(value));
                            } catch (e) {
                                reject(e);
                            }
                        }
                        function rejected(value) {
                            try {
                                step(generator['throw'](value));
                            } catch (e) {
                                reject(e);
                            }
                        }
                        function step(result) {
                            result.done
                                ? resolve(result.value)
                                : adopt(result.value).then(fulfilled, rejected);
                        }
                        step((generator = generator.apply(thisArg, _arguments || [])).next());
                    });
                }

                function __generator(thisArg, body) {
                    var _ = {
                            label: 0,
                            sent: function () {
                                if (t[0] & 1) throw t[1];
                                return t[1];
                            },
                            trys: [],
                            ops: [],
                        },
                        f,
                        y,
                        t,
                        g;
                    return (
                        (g = { next: verb(0), throw: verb(1), return: verb(2) }),
                        typeof Symbol === 'function' &&
                            (g[Symbol.iterator] = function () {
                                return this;
                            }),
                        g
                    );
                    function verb(n) {
                        return function (v) {
                            return step([n, v]);
                        };
                    }
                    function step(op) {
                        if (f) throw new TypeError('Generator is already executing.');
                        while (_)
                            try {
                                if (
                                    ((f = 1),
                                    y &&
                                        (t =
                                            op[0] & 2
                                                ? y['return']
                                                : op[0]
                                                ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                                                : y.next) &&
                                        !(t = t.call(y, op[1])).done)
                                )
                                    return t;
                                if (((y = 0), t)) op = [op[0] & 2, t.value];
                                switch (op[0]) {
                                    case 0:
                                    case 1:
                                        t = op;
                                        break;
                                    case 4:
                                        _.label++;
                                        return { value: op[1], done: false };
                                    case 5:
                                        _.label++;
                                        y = op[1];
                                        op = [0];
                                        continue;
                                    case 7:
                                        op = _.ops.pop();
                                        _.trys.pop();
                                        continue;
                                    default:
                                        if (
                                            !((t = _.trys),
                                            (t = t.length > 0 && t[t.length - 1])) &&
                                            (op[0] === 6 || op[0] === 2)
                                        ) {
                                            _ = 0;
                                            continue;
                                        }
                                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                            _.label = op[1];
                                            break;
                                        }
                                        if (op[0] === 6 && _.label < t[1]) {
                                            _.label = t[1];
                                            t = op;
                                            break;
                                        }
                                        if (t && _.label < t[2]) {
                                            _.label = t[2];
                                            _.ops.push(op);
                                            break;
                                        }
                                        if (t[2]) _.ops.pop();
                                        _.trys.pop();
                                        continue;
                                }
                                op = body.call(thisArg, _);
                            } catch (e) {
                                op = [6, e];
                                y = 0;
                            } finally {
                                f = t = 0;
                            }
                        if (op[0] & 5) throw op[1];
                        return { value: op[0] ? op[1] : void 0, done: true };
                    }
                }

                var __createBinding = Object.create
                    ? function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k;
                          Object.defineProperty(o, k2, {
                              enumerable: true,
                              get: function () {
                                  return m[k];
                              },
                          });
                      }
                    : function (o, m, k, k2) {
                          if (k2 === undefined) k2 = k;
                          o[k2] = m[k];
                      };

                function __exportStar(m, o) {
                    for (var p in m)
                        if (p !== 'default' && !Object.prototype.hasOwnProperty.call(o, p))
                            __createBinding(o, m, p);
                }

                function __values(o) {
                    var s = typeof Symbol === 'function' && Symbol.iterator,
                        m = s && o[s],
                        i = 0;
                    if (m) return m.call(o);
                    if (o && typeof o.length === 'number')
                        return {
                            next: function () {
                                if (o && i >= o.length) o = void 0;
                                return { value: o && o[i++], done: !o };
                            },
                        };
                    throw new TypeError(
                        s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.',
                    );
                }

                function __read(o, n) {
                    var m = typeof Symbol === 'function' && o[Symbol.iterator];
                    if (!m) return o;
                    var i = m.call(o),
                        r,
                        ar = [],
                        e;
                    try {
                        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
                    } catch (error) {
                        e = { error: error };
                    } finally {
                        try {
                            if (r && !r.done && (m = i['return'])) m.call(i);
                        } finally {
                            if (e) throw e.error;
                        }
                    }
                    return ar;
                }

                /** @deprecated */
                function __spread() {
                    for (var ar = [], i = 0; i < arguments.length; i++)
                        ar = ar.concat(__read(arguments[i]));
                    return ar;
                }

                /** @deprecated */
                function __spreadArrays() {
                    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
                        s += arguments[i].length;
                    for (var r = Array(s), k = 0, i = 0; i < il; i++)
                        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                            r[k] = a[j];
                    return r;
                }

                function __spreadArray(to, from, pack) {
                    if (pack || arguments.length === 2)
                        for (var i = 0, l = from.length, ar; i < l; i++) {
                            if (ar || !(i in from)) {
                                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                                ar[i] = from[i];
                            }
                        }
                    return to.concat(ar || Array.prototype.slice.call(from));
                }

                function __await(v) {
                    return this instanceof __await ? ((this.v = v), this) : new __await(v);
                }

                function __asyncGenerator(thisArg, _arguments, generator) {
                    if (!Symbol.asyncIterator)
                        throw new TypeError('Symbol.asyncIterator is not defined.');
                    var g = generator.apply(thisArg, _arguments || []),
                        i,
                        q = [];
                    return (
                        (i = {}),
                        verb('next'),
                        verb('throw'),
                        verb('return'),
                        (i[Symbol.asyncIterator] = function () {
                            return this;
                        }),
                        i
                    );
                    function verb(n) {
                        if (g[n])
                            i[n] = function (v) {
                                return new Promise(function (a, b) {
                                    q.push([n, v, a, b]) > 1 || resume(n, v);
                                });
                            };
                    }
                    function resume(n, v) {
                        try {
                            step(g[n](v));
                        } catch (e) {
                            settle(q[0][3], e);
                        }
                    }
                    function step(r) {
                        r.value instanceof __await
                            ? Promise.resolve(r.value.v).then(fulfill, reject)
                            : settle(q[0][2], r);
                    }
                    function fulfill(value) {
                        resume('next', value);
                    }
                    function reject(value) {
                        resume('throw', value);
                    }
                    function settle(f, v) {
                        if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
                    }
                }

                function __asyncDelegator(o) {
                    var i, p;
                    return (
                        (i = {}),
                        verb('next'),
                        verb('throw', function (e) {
                            throw e;
                        }),
                        verb('return'),
                        (i[Symbol.iterator] = function () {
                            return this;
                        }),
                        i
                    );
                    function verb(n, f) {
                        i[n] = o[n]
                            ? function (v) {
                                  return (p = !p)
                                      ? { value: __await(o[n](v)), done: n === 'return' }
                                      : f
                                      ? f(v)
                                      : v;
                              }
                            : f;
                    }
                }

                function __asyncValues(o) {
                    if (!Symbol.asyncIterator)
                        throw new TypeError('Symbol.asyncIterator is not defined.');
                    var m = o[Symbol.asyncIterator],
                        i;
                    return m
                        ? m.call(o)
                        : ((o =
                              typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
                          (i = {}),
                          verb('next'),
                          verb('throw'),
                          verb('return'),
                          (i[Symbol.asyncIterator] = function () {
                              return this;
                          }),
                          i);
                    function verb(n) {
                        i[n] =
                            o[n] &&
                            function (v) {
                                return new Promise(function (resolve, reject) {
                                    (v = o[n](v)), settle(resolve, reject, v.done, v.value);
                                });
                            };
                    }
                    function settle(resolve, reject, d, v) {
                        Promise.resolve(v).then(function (v) {
                            resolve({ value: v, done: d });
                        }, reject);
                    }
                }

                function __makeTemplateObject(cooked, raw) {
                    if (Object.defineProperty) {
                        Object.defineProperty(cooked, 'raw', { value: raw });
                    } else {
                        cooked.raw = raw;
                    }
                    return cooked;
                }

                var __setModuleDefault = Object.create
                    ? function (o, v) {
                          Object.defineProperty(o, 'default', { enumerable: true, value: v });
                      }
                    : function (o, v) {
                          o['default'] = v;
                      };

                function __importStar(mod) {
                    if (mod && mod.__esModule) return mod;
                    var result = {};
                    if (mod != null)
                        for (var k in mod)
                            if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
                                __createBinding(result, mod, k);
                    __setModuleDefault(result, mod);
                    return result;
                }

                function __importDefault(mod) {
                    return mod && mod.__esModule ? mod : { default: mod };
                }

                function __classPrivateFieldGet(receiver, state, kind, f) {
                    if (kind === 'a' && !f)
                        throw new TypeError('Private accessor was defined without a getter');
                    if (
                        typeof state === 'function'
                            ? receiver !== state || !f
                            : !state.has(receiver)
                    )
                        throw new TypeError(
                            'Cannot read private member from an object whose class did not declare it',
                        );
                    return kind === 'm'
                        ? f
                        : kind === 'a'
                        ? f.call(receiver)
                        : f
                        ? f.value
                        : state.get(receiver);
                }

                function __classPrivateFieldSet(receiver, state, value, kind, f) {
                    if (kind === 'm') throw new TypeError('Private method is not writable');
                    if (kind === 'a' && !f)
                        throw new TypeError('Private accessor was defined without a setter');
                    if (
                        typeof state === 'function'
                            ? receiver !== state || !f
                            : !state.has(receiver)
                    )
                        throw new TypeError(
                            'Cannot write private member to an object whose class did not declare it',
                        );
                    return (
                        kind === 'a'
                            ? f.call(receiver, value)
                            : f
                            ? (f.value = value)
                            : state.set(receiver, value),
                        value
                    );
                }

                /***/
            },

            /******/
        };
        /************************************************************************/
        /******/ // The module cache
        /******/ var __webpack_module_cache__ = {};
        /******/
        /******/ // The require function
        /******/ function __webpack_require__(moduleId) {
            /******/ // Check if module is in cache
            /******/ var cachedModule = __webpack_module_cache__[moduleId];
            /******/ if (cachedModule !== undefined) {
                /******/ return cachedModule.exports;
                /******/
            }
            /******/ // Create a new module (and put it into the cache)
            /******/ var module = (__webpack_module_cache__[moduleId] = {
                /******/ // no module.id needed
                /******/ // no module.loaded needed
                /******/ exports: {},
                /******/
            });
            /******/
            /******/ // Execute the module function
            /******/ __webpack_modules__[moduleId].call(
                module.exports,
                module,
                module.exports,
                __webpack_require__,
            );
            /******/
            /******/ // Return the exports of the module
            /******/ return module.exports;
            /******/
        }
        /******/
        /************************************************************************/
        /******/ /* webpack/runtime/define property getters */
        /******/ (() => {
            /******/ // define getter functions for harmony exports
            /******/ __webpack_require__.d = (exports, definition) => {
                /******/ for (var key in definition) {
                    /******/ if (
                        __webpack_require__.o(definition, key) &&
                        !__webpack_require__.o(exports, key)
                    ) {
                        /******/ Object.defineProperty(exports, key, {
                            enumerable: true,
                            get: definition[key],
                        });
                        /******/
                    }
                    /******/
                }
                /******/
            };
            /******/
        })();
        /******/
        /******/ /* webpack/runtime/global */
        /******/ (() => {
            /******/ __webpack_require__.g = (function () {
                /******/ if (typeof globalThis === 'object') return globalThis;
                /******/ try {
                    /******/ return this || new Function('return this')();
                    /******/
                } catch (e) {
                    /******/ if (typeof window === 'object') return window;
                    /******/
                }
                /******/
            })();
            /******/
        })();
        /******/
        /******/ /* webpack/runtime/hasOwnProperty shorthand */
        /******/ (() => {
            /******/ __webpack_require__.o = (obj, prop) =>
                Object.prototype.hasOwnProperty.call(obj, prop);
            /******/
        })();
        /******/
        /******/ /* webpack/runtime/make namespace object */
        /******/ (() => {
            /******/ // define __esModule on exports
            /******/ __webpack_require__.r = exports => {
                /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
                    /******/ Object.defineProperty(exports, Symbol.toStringTag, {
                        value: 'Module',
                    });
                    /******/
                }
                /******/ Object.defineProperty(exports, '__esModule', { value: true });
                /******/
            };
            /******/
        })();
        /******/
        /************************************************************************/
        /******/
        /******/ // startup
        /******/ // Load entry module and return exports
        /******/ // This entry module is referenced by other modules so it can't be inlined
        /******/ var __webpack_exports__ = __webpack_require__('./src/index.ts');
        /******/ __webpack_exports__ = __webpack_exports__['default'];
        /******/
        /******/ return __webpack_exports__;
        /******/
    })();
});
