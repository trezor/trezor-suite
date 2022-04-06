import EventEmitter from 'events';
import { createDeferred, Deferred } from '@trezor/utils/lib/createDeferred';
// @ts-ignore REF-TODO
import { Core, init as initCore, initTransport } from 'trezor-connect/lib/core/Core';
import { factory } from './factory';
import { parse as parseSettings } from './data/ConnectSettings';
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
    ErrorMessage,
    CoreMessage,
    PostMessageEvent,
    UI,
    UiResponseEvent,
    Call,
    _CallMessage,
} from './events';
import { ERRORS } from './constants';
import type { TrezorConnect, ConnectSettings, Manifest, Response } from './types';

export const eventEmitter = new EventEmitter();
const _log = initLog('[trezor-connect.js]');

let _settings = parseSettings();
let _core: Core | null = null;

let _messageID = 0;
export const messagePromises: { [key: number]: Deferred<any> } = {};

const manifest = (data: Manifest) => {
    _settings = parseSettings({
        ..._settings,
        manifest: data,
    });
};

const dispose = () => {
    eventEmitter.removeAllListeners();
    _settings = parseSettings();
    if (_core) {
        _core.dispose();
        _core = null;
    }
};

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

    _log.log('handleMessage', message);

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
            _log.log('Undefined message', event, message);
    }
};

type PostMessage = Omit<CoreMessage, 'event' | 'id'>;
function postMessage<R>(message: PostMessage, usePromise?: true): R;
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

const init = async (settings: Partial<ConnectSettings> = {}) => {
    if (_core) {
        throw ERRORS.TypedError('Init_AlreadyInitialized');
    }
    _settings = parseSettings({ ..._settings, ...settings });
    // set defaults for node
    _settings.origin = 'http://node.trezor.io/';
    _settings.popup = false;
    _settings.env = 'node';

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    if (_settings.lazyLoad) {
        // reset "lazyLoad" after first use
        _settings.lazyLoad = false;
        return;
    }

    _log.enabled = !!_settings.debug;

    _core = await initCore(_settings);
    _core.on(CORE_EVENT, handleMessage);

    await initTransport(_settings);
};

const call = async <M extends keyof TrezorConnect, R extends Response<any>>(
    params: _CallMessage<M>,
) => {
    // const call: Call = async params => {
    if (!_core) {
        try {
            await init(_settings);
        } catch (error) {
            return ErrorMessage(error);
        }
    }

    try {
        const response = await postMessage<R>({ type: IFRAME.CALL, payload: params });
        if (response) {
            return response;
        }
        return ErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _log.error('__call error', error);
        return ErrorMessage(error);
    }
};

const customMessageResponse = (payload?: { message: string; params?: any }) => {
    if (!_core) {
        return Promise.resolve(ErrorMessage(ERRORS.TypedError('Init_NotInitialized')));
    }
    _core.handleMessage(
        {
            event: UI_EVENT,
            type: UI.CUSTOM_MESSAGE_RESPONSE,
            payload,
        },
        true,
    );
};

const uiResponse = (response: UiResponseEvent) => {
    if (!_core) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    const { type, payload } = response;
    _core.handleMessage({ event: UI_EVENT, type, payload }, true);
};

const getSettings = () => {
    if (!_core) {
        return Promise.resolve(ErrorMessage(ERRORS.TypedError('Init_NotInitialized')));
    }
    return call({ method: 'getSettings' });
};

const customMessage = async (params: any) => {
    if (!_core) {
        return Promise.resolve(ErrorMessage(ERRORS.TypedError('Init_NotInitialized')));
    }
    if (typeof params.callback !== 'function') {
        return ErrorMessage(ERRORS.TypedError('Method_CustomMessage_Callback'));
    }

    const core = _core;

    // TODO: set message listener only if iframe is loaded correctly
    const { callback } = params;
    const customMessageListener = async (event: PostMessageEvent) => {
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
    core.on(CORE_EVENT, customMessageListener);

    const response = await call({ method: 'customMessage', ...params, callback: null });
    core.removeListener(CORE_EVENT, customMessageListener);
    return response;
};

const requestLogin = async (params: any) => {
    if (!_core) {
        return Promise.resolve(ErrorMessage(ERRORS.TypedError('Init_NotInitialized')));
    }

    const core = _core;

    if (typeof params.callback === 'function') {
        const { callback } = params;

        // TODO: set message listener only if iframe is loaded correctly
        const loginChallengeListener = async (event: PostMessageEvent) => {
            const { data } = event;
            if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                try {
                    const payload = await callback();
                    core.handleMessage(
                        {
                            event: UI_EVENT,
                            type: UI.LOGIN_CHALLENGE_RESPONSE,
                            payload,
                        },
                        true,
                    );
                } catch (error) {
                    core.handleMessage(
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

        core.on(CORE_EVENT, loginChallengeListener);

        const response = await call({
            method: 'requestLogin',
            ...params,
            asyncChallenge: true,
            callback: null,
        });
        core.removeListener(CORE_EVENT, loginChallengeListener);
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

const TrezorConnect = factory({
    eventEmitter,
    manifest,
    init,
    call: call as Call,
    getSettings,
    customMessage,
    requestLogin,
    uiResponse,
    renderWebUSBButton,
    disableWebUSB,
    cancel,
    dispose,
});
export default TrezorConnect;

export { Messages as ProtobufMessages } from '@trezor/transport';
export * from './constants';
export * from './events';
export * from './types';
