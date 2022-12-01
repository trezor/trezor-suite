import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts
import {
    POPUP,
    IFRAME,
    UI,
    ERRORS,
    CORE_EVENT,
    UI_EVENT,
    DEVICE_EVENT,
    RESPONSE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    TRANSPORT,
    parseConnectSettings,
    createErrorMessage,
    CoreMessage,
    ConnectSettings,
    // Manifest,
    PostMessageEvent,
    UiResponseEvent,
    CallMethod,
    CallMethodAnyResponse,
} from '@trezor/connect/lib/exports';
import { Core, init as initCore, initTransport } from '@trezor/connect/lib/core';
import { factory } from '@trezor/connect/lib/factory';
import { manifest, dispose } from '@trezor/connect/lib';

import { initLog } from '@trezor/connect/lib/utils/debug';

import { createDeferred, Deferred } from '@trezor/utils';

import webUSBButton from './webusb/button';

export const eventEmitter = new EventEmitter();
const _log = initLog('@trezor/connect');

let _settings = parseConnectSettings();
let _core: Core | null = null;

let _messageID = 0;
export const messagePromises: { [key: number]: Deferred<any> } = {};

// handle message received from iframe
const handleMessage = (message: CoreMessage) => {
    const { event, type, payload } = message;
    const id = message.id || 0;

    if (!_core) return;

    if (type === UI.REQUEST_UI_WINDOW) {
        _core.handleMessage({ event: UI_EVENT, type: POPUP.HANDSHAKE }, true);
        return;
    }

    if (type === POPUP.CANCEL_POPUP_REQUEST) return;

    _log.debug('handleMessage', message);

    switch (event) {
        case RESPONSE_EVENT:
            if (messagePromises[id]) {
                // resolve message promise (send result of call method)
                messagePromises[id].resolve({
                    id,
                    success: message.success,
                    payload,
                });
                delete messagePromises[id];
            } else {
                _log.warn(`Unknown message id ${id}`);
            }
            break;

        case DEVICE_EVENT:
            // pass DEVICE event up to html
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)
            break;

        case TRANSPORT_EVENT:
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload);
            break;

        case BLOCKCHAIN_EVENT:
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload);
            break;

        case UI_EVENT:
            // pass UI event up
            eventEmitter.emit(event, message);
            eventEmitter.emit(type, payload);
            break;

        default:
            _log.warn('Undefined message', event, message);
    }
};

type PostMessage = Omit<CoreMessage, 'event' | 'id'> & { event?: typeof UI_EVENT };
function postMessage(message: PostMessage, usePromise?: true): CallMethodAnyResponse;
function postMessage(message: PostMessage, usePromise: false): Promise<void>;
function postMessage(message: PostMessage, usePromise = true) {
    if (!_core) {
        throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
    }
    if (usePromise) {
        _messageID++;
        messagePromises[_messageID] = createDeferred();
        const { promise } = messagePromises[_messageID];
        _core.handleMessage({ ...message, id: _messageID }, true);
        return promise;
    }

    _core.handleMessage(message, true);
}

const init = async (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    _settings = parseConnectSettings({ ..._settings, ...settings });

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }
    // todo: ??
    _settings.origin = 'http://web.trezor.io/';

    if (_settings.lazyLoad) {
        // reset "lazyLoad" after first use
        _settings.lazyLoad = false;
        return;
    }

    _log.enabled = !!_settings.debug;

    _core = initCore(_settings);
    _core.on(CORE_EVENT, handleMessage);

    await initTransport(_settings);
};

const call: CallMethod = async params => {
    if (!_core) {
        try {
            await init(_settings);
        } catch (error) {
            return createErrorMessage(error);
        }
    }

    try {
        const response = await postMessage({
            type: IFRAME.CALL,
            payload: params,
        });
        if (response) {
            return response;
        }
        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _log.error('call', error);
        return createErrorMessage(error);
    }
};

const uiResponse = (response: UiResponseEvent) => {
    if (!_core) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    const { type, payload } = response;
    _core.handleMessage({ event: UI_EVENT, type, payload }, true);
};

const renderWebUSBButton = (className?: string) => {
    webUSBButton(className, _settings.webusbSrc);
};

const requestLogin = async (params: any) => {
    if (typeof params.callback === 'function') {
        const { callback } = params;

        // TODO: set message listener only if _core is loaded correctly
        const loginChallengeListener = async (event: PostMessageEvent) => {
            const { data } = event;
            if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                try {
                    const payload = await callback();
                    _core?.handleMessage(
                        {
                            event: UI_EVENT,
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload,
                        },
                        true,
                    );
                } catch (error) {
                    _core?.handleMessage(
                        {
                            event: UI_EVENT,
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload: error.message,
                        },
                        true,
                    );
                }
            }
        };

        _core?.on(CORE_EVENT, loginChallengeListener);
        const response = await call({
            method: 'requestLogin',
            ...params,
            asyncChallenge: true,
            callback: null,
        });
        _core?.removeListener(CORE_EVENT, loginChallengeListener);
        return response;
    }
    return call({ method: 'requestLogin', ...params });
};

const cancel = (error?: string) => {
    postMessage(
        {
            type: POPUP.CLOSED,
            payload: error ? { error } : null,
        },
        false,
    );
};

const disableWebUSB = () => {
    if (!_core) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    postMessage({
        event: UI_EVENT,
        type: TRANSPORT.DISABLE_WEBUSB,
    });
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
    cancel,
    dispose,
});

export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
