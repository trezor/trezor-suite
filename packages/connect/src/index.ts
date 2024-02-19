import EventEmitter from 'events';

import { createDeferredManager } from '@trezor/utils';

import { Core, initCore } from './core';
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
    CoreEventMessage,
    UI,
    UiResponseEvent,
    CallMethod,
} from './events';
import { ERRORS } from './constants';
import type { ConnectSettings, Manifest } from './types';

export const eventEmitter = new EventEmitter();
const _log = initLog('@trezor/connect');

let _settings = parseConnectSettings();
let _core: Core | null = null;

const messagePromises = createDeferredManager({ initialId: 1 });

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

console.log('WIP: just to trigger GitHub deploy to dev!');
console.log('WIP');

// handle message received from iframe
const handleMessage = (message: CoreEventMessage) => {
    const { event, type, payload } = message;

    if (!_core) return;

    if (type === UI.REQUEST_UI_WINDOW) {
        _core.handleMessage({ type: POPUP.HANDSHAKE });

        return;
    }

    if (type === POPUP.CANCEL_POPUP_REQUEST) return;

    _log.debug('handleMessage', message);

    switch (event) {
        case RESPONSE_EVENT: {
            const { id = 0, success } = message;
            const resolved = messagePromises.resolve(id, { id, success, payload });
            if (!resolved) _log.warn(`Unknown message id ${id}`);
            break;
        }
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

    _core = await initCore(_settings, handleMessage);
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
        if (!_core) {
            throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
        }

        const { promiseId, promise } = messagePromises.create();
        _core.handleMessage({
            type: IFRAME.CALL,
            payload: params,
            id: promiseId,
        });
        const response = await promise;

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
    _core.handleMessage(response);
};

const requestLogin = async (params: any) => {
    if (typeof params.callback === 'function') {
        const { callback } = params;

        // TODO: set message listener only if _core is loaded correctly
        const loginChallengeListener = async (event: MessageEvent<CoreEventMessage>) => {
            const { data } = event;
            if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
                try {
                    const payload = await callback();
                    _core?.handleMessage({
                        type: UI.LOGIN_CHALLENGE_RESPONSE,
                        payload,
                    });
                } catch (error) {
                    _core?.handleMessage({
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
    if (!_core) {
        throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
    }

    _core.handleMessage({
        type: POPUP.CLOSED,
        payload: error ? { error } : null,
    });
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
    cancel,
    dispose,
});

export default TrezorConnect;
export * from './exports';
