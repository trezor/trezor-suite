/// <reference types="@types/web-bluetooth" />

import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts
import {
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
    createUiMessage,
    createErrorMessage,
    ConnectSettings,
    Manifest,
    PostMessageEvent,
    UiResponseEvent,
    CallMethod,
} from '@trezor/connect/lib/exports';
import { factory } from '@trezor/connect/lib/factory';
import { initLog } from '@trezor/connect/lib/utils/debug';
import { config } from '@trezor/connect/lib/data/config';

import * as iframe from './iframe';
import * as popup from './popup';
import webUSBButton from './webusb/button';
import { parseConnectSettings } from './connectSettings';

const eventEmitter = new EventEmitter();
const _log = initLog('@trezor/connect-web');

let _settings = parseConnectSettings();
let _popupManager: popup.PopupManager | undefined;

const initPopupManager = () => {
    const pm = new popup.PopupManager(_settings);
    pm.on(POPUP.CLOSED, (error?: string) => {
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

const manifest = (data: Manifest) => {
    _settings = parseConnectSettings({
        ..._settings,
        manifest: data,
    });
};

const dispose = () => {
    eventEmitter.removeAllListeners();
    iframe.dispose();
    _settings = parseConnectSettings();
    if (_popupManager) {
        _popupManager.close();
    }
    return Promise.resolve(undefined);
};

const cancel = (error?: string) => {
    if (_popupManager) {
        _popupManager.emit(POPUP.CLOSED, error);
    }
};

// handle message received from iframe
const handleMessage = (messageEvent: PostMessageEvent) => {
    // ignore messages from domain other then iframe origin
    if (messageEvent.origin !== iframe.origin) return;

    const message = parseMessage(messageEvent.data);
    const id = message.id || 0;

    _log.log('handleMessage', message);

    switch (message.event) {
        case RESPONSE_EVENT:
            if (iframe.messagePromises[id]) {
                // resolve message promise (send result of call method)
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
            // pass DEVICE event up to html
            eventEmitter.emit(message.event, message);
            eventEmitter.emit(message.type, message.payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
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
                iframe.initPromise.reject(message.payload.error as any);
            }

            // pass UI event up
            eventEmitter.emit(message.event, message);
            eventEmitter.emit(message.type, message.payload);
            break;

        default:
            _log.log('Undefined message', message.event, messageEvent.data);
    }
};

const init = async (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    if (iframe.instance) {
        throw ERRORS.TypedError('Init_AlreadyInitialized');
    }

    _settings = parseConnectSettings({ ..._settings, ...settings });

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    // defaults for connect-web
    if (!_settings.transports?.length) {
        _settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }

    if (_settings.lazyLoad) {
        // reset "lazyLoad" after first use
        _settings.lazyLoad = false;
        return;
    }

    if (!_popupManager) {
        _popupManager = initPopupManager();
    }

    // connect-web is running in third-party domain so we use iframe to pass logs to shared worker.
    iframe.initIframeLogger();
    _log.enabled = !!_settings.debug;

    window.addEventListener('message', handleMessage);
    window.addEventListener('unload', dispose);

    await iframe.init(_settings);
};

const call: CallMethod = async params => {
    if (!iframe.instance && !iframe.timeout) {
        // init popup with lazy loading before iframe initialization
        _settings = parseConnectSettings(_settings);

        if (!_settings.manifest) {
            return createErrorMessage(ERRORS.TypedError('Init_ManifestMissing'));
        }

        if (!_popupManager) {
            _popupManager = initPopupManager();
        }
        _popupManager.request();

        // auto init with default settings
        try {
            await init(_settings);
        } catch (error) {
            if (_popupManager) {
                // Catch fatal iframe errors (not loading)
                if (['Init_IframeBlocked', 'Init_IframeTimeout'].includes(error.code)) {
                    _popupManager.postMessage(createUiMessage(UI.IFRAME_FAILURE));
                } else {
                    _popupManager.clear();
                }
            }
            return createErrorMessage(error);
        }
    }

    if (iframe.timeout) {
        // this.init was called, but iframe doesn't return handshake yet
        return createErrorMessage(ERRORS.TypedError('Init_ManifestMissing'));
    }
    if (iframe.error) {
        // iframe was initialized with error
        return createErrorMessage(iframe.error);
    }

    // request popup window it might be used in the future
    if (_settings.popup && _popupManager) {
        _popupManager.request();
    }

    // post message to iframe
    try {
        const response = await iframe.postMessage({ type: IFRAME.CALL, payload: params });
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
        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _log.error('__call error', error);
        if (_popupManager) {
            _popupManager.clear();
        }
        return createErrorMessage(error);
    }
};

const uiResponse = (response: UiResponseEvent) => {
    if (!iframe.instance) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    const { type, payload } = response;
    iframe.postMessage({ event: UI_EVENT, type, payload });
};

const renderWebUSBButton = (className?: string) => {
    webUSBButton(className, _settings.webusbSrc);
};

const requestLogin = async (params: any) => {
    if (typeof params.callback === 'function') {
        const { callback } = params;

        // TODO: set message listener only if iframe is loaded correctly
        const loginChallengeListener = async (event: PostMessageEvent) => {
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

        const response = await call({
            method: 'requestLogin',
            ...params,
            asyncChallenge: true,
            callback: null,
        });
        window.removeEventListener('message', loginChallengeListener);
        return response;
    }
    return call({ method: 'requestLogin', ...params });
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

/**
 * Initiate device pairing procedure.
 */
const requestWebUSBDevice = async () => {
    try {
        await window.navigator.usb.requestDevice({ filters: config.webusb });
        iframe.postMessage({
            event: UI_EVENT,
            type: TRANSPORT.REQUEST_DEVICE,
        });
    } catch (_err) {
        // user hits cancel gets "DOMException: No device selected."
        // no need to log this
    }
};

const requestWebBluetoothDevice = async () => {
    try {
        await window.navigator.bluetooth.requestDevice({
            filters: [{ services: ['00000001-0000-1000-8000-00805f9b34fb'] }],
        });
        iframe.postMessage({
            event: UI_EVENT,
            type: TRANSPORT.REQUEST_DEVICE,
        });
    } catch (err) {
        console.log('ERRRRROR', err.message);
    }
};

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    requestWebUSBDevice,
    requestWebBluetoothDevice,
    cancel,
    dispose,
});

export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
