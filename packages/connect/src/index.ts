import EventEmitter from 'events';

import { createDeferred, Deferred } from '@trezor/utils';
import { Core, initCore, initTransport } from './core';
import { factory } from './factory';
import { parseConnectSettings } from './data/connectSettings';
import { initLog } from './utils/debug';
import {
    CORE_EVENT,
    UI_EVENT,
    DEVICE_EVENT,
    RESPONSE_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
    POPUP,
    IFRAME,
    createErrorMessage,
    CoreMessage,
    PostMessageEvent,
    UI,
    UiResponseEvent,
    CallMethod,
    CallMethodAnyResponse,
} from './events';
import { ERRORS } from './constants';
import type { ConnectSettings, Manifest } from './types';

export const eventEmitter = new EventEmitter();
const _log = initLog('@trezor/connect');

let _settings = parseConnectSettings();
let _core: Core | null = null;

let _messageID = 0;
export const messagePromises: { [key: number]: Deferred<any> } = {};

const manifest = (data: Manifest) => {
    _settings = parseConnectSettings({
        ..._settings,
        manifest: data,
    });
};

const dispose = async () => {
    eventEmitter.removeAllListeners();
    _settings = parseConnectSettings();
    if (_core) {
        await _core.dispose();
        _core = null;
    }
};

// handle message received from iframe
const handleMessage = (message: CoreMessage) => {
    const { event, type, payload } = message;
    const id = message.id || 0;

    if (!_core) return;

    if (type === UI.REQUEST_UI_WINDOW) {
        _core.handleMessage({ event: UI_EVENT, type: POPUP.HANDSHAKE });
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

type PostMessage = Omit<CoreMessage, 'event' | 'id'>;
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
        _core.handleMessage({ ...message, id: _messageID });
        return promise;
    }

    _core.handleMessage(message);
}

const init = async (settings: Partial<ConnectSettings> = {}) => {
    if (_core) {
        throw ERRORS.TypedError('Init_AlreadyInitialized');
    }
    _settings = parseConnectSettings({ ..._settings, ...settings, popup: false });

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    if (!_settings.transports?.length) {
        // default fallback for node
        _settings.transports = ['BridgeTransport'];
    }

    if (_settings.lazyLoad) {
        // reset "lazyLoad" after first use
        _settings.lazyLoad = false;
        return;
    }

    _core = await initCore(_settings);
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
    _core.handleMessage({ event: UI_EVENT, type, payload });
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
                    _core?.handleMessage({
                        event: UI_EVENT,
                        type: UI.LOGIN_CHALLENGE_RESPONSE,
                        payload,
                    });
                } catch (error) {
                    _core?.handleMessage({
                        event: UI_EVENT,
                        type: UI.LOGIN_CHALLENGE_RESPONSE,
                        payload: error.message,
                    });
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

const renderWebUSBButton = (_className?: string) => {
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const disableWebUSB = () => {
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestWebUSBDevice = () => {
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestWebBluetoothDevice = () => {
    throw ERRORS.TypedError('Method_InvalidPackage');
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
export * from './exports';
