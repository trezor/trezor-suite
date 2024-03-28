import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
import {
    POPUP,
    IFRAME,
    UI_EVENT,
    createErrorMessage,
    UiResponseEvent,
    CallMethod,
} from '@trezor/connect/src/events';
import * as ERRORS from '@trezor/connect/src/constants/errors';
import type { ConnectSettings, Manifest } from '@trezor/connect/src/types';
import { factory } from '@trezor/connect/src/factory';
import { initLog, setLogWriter, LogMessage, LogWriter } from '@trezor/connect/src/utils/debug';
import * as popup from '../../popup';

import { parseConnectSettings } from '../../connectSettings';

const eventEmitter = new EventEmitter();
let _settings = parseConnectSettings();

/**
 * setup logger.
 * service worker cant communicate directly with sharedworker logger so the communication is as follows:
 * - service worker -> content script -> popup -> sharedworker
 * todo: this could be simplified by injecting additional content script into log.html
 */
const logger = initLog('@trezor/connect-web');
const popupManagerLogger = initLog('@trezor/connect-web/popupManager');
let _popupManager: popup.PopupManager;

const logWriterFactory = (popupManager: popup.PopupManager): LogWriter => ({
    add: (message: LogMessage) => {
        popupManager.channel.postMessage(
            {
                event: UI_EVENT,
                type: IFRAME.LOG,
                payload: message,
            },
            { usePromise: false, useQueue: true },
        );
    },
});

const manifest = (data: Manifest) => {
    _settings = parseConnectSettings({
        ..._settings,
        manifest: data,
    });
};

const dispose = () => {
    eventEmitter.removeAllListeners();
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

const init = (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    const equalSettings = JSON.stringify(_settings) === JSON.stringify(settings);
    _settings = parseConnectSettings({ ..._settings, ...settings });
    if (!_popupManager || !equalSettings) {
        _settings.useCoreInPopup = true;
        _settings.origin = window.location.origin;
        _popupManager = new popup.PopupManager(_settings, { logger: popupManagerLogger });
        setLogWriter(() => logWriterFactory(_popupManager));
    }

    logger.enabled = !!settings.debug;

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    // defaults for connect-web
    if (!_settings.transports?.length) {
        _settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }

    logger.debug('initiated');

    return Promise.resolve();
};

/**
 * 1. opens popup
 * 2. sends request to popup where the request is handled by core
 * 3. returns response
 */
const call: CallMethod = async params => {
    logger.debug('call', params);

    // request popup window it might be used in the future
    if (_settings.popup) {
        await _popupManager.request();
    }
    logger.debug('popup requested');

    await _popupManager.channel.init();
    logger.debug('channel initiated');
    _popupManager.channel.postMessage({
        type: POPUP.INIT,
        payload: {
            settings: _settings,
            useCore: true,
        },
    });

    logger.debug('awaiting init');
    await _popupManager.handshakePromise?.promise;

    // post message to core in popup
    try {
        logger.debug('call: postMessage', params);
        const response = await _popupManager.channel.postMessage({
            type: IFRAME.CALL,
            payload: params,
        });

        logger.debug('call: response: ', response);

        if (response) {
            if (_popupManager) {
                _popupManager.clear();
            }

            return response;
        }

        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        logger.error('call: error', error);
        _popupManager.clear();

        return createErrorMessage(error);
    }
};

const uiResponse = (response: UiResponseEvent) => {
    const { type, payload } = response;
    _popupManager.channel.postMessage({ event: UI_EVENT, type, payload });
};

const renderWebUSBButton = () => {};

const requestLogin = () => {
    // todo: not supported yet
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const disableWebUSB = () => {
    // todo: not supported yet, probably not needed
    throw ERRORS.TypedError('Method_InvalidPackage');
};

const requestWebUSBDevice = () => {
    // not needed - webusb pairing happens in popup
    throw ERRORS.TypedError('Method_InvalidPackage');
};

export const methods = {
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
};

const TrezorConnect = factory(methods);

export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
