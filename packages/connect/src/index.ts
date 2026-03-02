import { ERRORS } from '@trezor/connect-common/src/constants';
import { createDeferredManager, deepEqual } from '@trezor/utils';

import { reconnectAllBackends } from './backend/BlockchainLink';
import { initCoreState } from './core';
import { DataManager } from './data/DataManager';
import { parseConnectSettings } from './data/connectSettings';
import {
    BLOCKCHAIN_EVENT,
    CORE_CALL,
    CallMethod,
    CoreEventMessage,
    DEVICE_EVENT,
    POPUP,
    RESPONSE_EVENT,
    TRANSPORT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UiResponseEvent,
    createErrorMessage,
} from './events';
import { factory } from './factory';
import type { ConnectSettings } from './types';
import type { UpdateConnectSettings } from './types/api/updateConnectSettings';
import { ConnectEmitter } from './types/emitter';
import { initLog } from './utils/debug';

const eventEmitter = new ConnectEmitter();
const _log = initLog('@trezor/connect');

let _settings = parseConnectSettings();

const coreManager = initCoreState();
const messagePromises = createDeferredManager({ initialId: 1 });

const dispose = () => {
    eventEmitter.removeAllListeners();
    _settings = parseConnectSettings();
    coreManager.dispose();
};

// handle message received from Core
const onCoreEvent = (message: CoreEventMessage) => {
    _log.debug('handleMessage', message.type);

    switch (message.event) {
        case RESPONSE_EVENT: {
            const { id = 0, success, device } = message;
            const resolved = messagePromises.resolve(
                id,
                success
                    ? { id, success, payload: message.payload, device }
                    : { id, success, error: message.error, device },
            );
            if (!resolved) _log.warn(`Unknown message id ${id}`);
            break;
        }
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
            // pass UI event up
            eventEmitter.emit(message.event, message);
            eventEmitter.emit(message.type, message.payload);
            break;

        default:
            _log.warn('Undefined message', message);
    }
};

const initSettings = (settings: Partial<ConnectSettings> = {}) => {
    _settings = parseConnectSettings({ ..._settings, ...settings });

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    if (!_settings.transports?.length) {
        // default fallback for node
        _settings.transports = ['BridgeTransport'];
    }
};

const init = async (settings: Partial<ConnectSettings>) => {
    if (coreManager.get() || coreManager.getPending()) {
        throw ERRORS.TypedError('Init_AlreadyInitialized');
    }

    initSettings(settings);

    await coreManager.getOrInit(_settings, onCoreEvent);
};

const initCore = () => {
    // todo: only to keep manifest validation during 'lazyload' call, will be reworked
    initSettings({});

    return coreManager.getOrInit(_settings, onCoreEvent);
};

const call: CallMethod = async params => {
    let core;
    try {
        core = coreManager.get() ?? (await coreManager.getPending()) ?? (await initCore());
    } catch (error) {
        return createErrorMessage(error);
    }

    try {
        const { promiseId, promise } = messagePromises.create();
        core.handleMessage({
            type: CORE_CALL,
            payload: params,
            id: promiseId,
        });
        const response = await promise;

        return response ?? createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        _log.error('call', error);

        return createErrorMessage(error);
    }
};

const updateConnectSettings = async (params: UpdateConnectSettings) => {
    const { proxy, transports } = params;

    const settings = DataManager.getSettings();
    if (proxy !== undefined && !deepEqual(settings.proxy, proxy)) {
        DataManager.updateSettings({ proxy });
        await reconnectAllBackends();
    }

    if (transports !== undefined) {
        const core = coreManager.get();
        if (!core) {
            return createErrorMessage(ERRORS.TypedError('Init_NotInitialized'));
        }
        core.handleMessage({ type: TRANSPORT.SET_TRANSPORTS, payload: { transports } });
    }

    return { success: true as const, payload: { message: 'success' } } as const;
};

const uiResponse = (response: UiResponseEvent) => {
    const core = coreManager.get();
    if (!core) {
        throw ERRORS.TypedError('Init_NotInitialized');
    }
    core.handleMessage(response);
};

const cancel = (error?: string) => {
    const core = coreManager.get();
    if (!core) {
        throw ERRORS.TypedError('Runtime', 'postMessage: _core not found');
    }

    core.handleMessage({
        type: POPUP.CLOSED,
        payload: error ? { error } : null,
    });
};

const TrezorConnect = factory(
    {
        eventEmitter,
        init,
        call,
        updateConnectSettings,
        uiResponse,
        cancel,
        dispose,
    },
    {},
);

export default TrezorConnect;

// allowed only here
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export * from './exports';
