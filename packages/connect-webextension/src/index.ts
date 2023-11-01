import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index due to NormalReplacementPlugin
// in packages/suite-build/configs/web.webpack.config.ts
import {
    POPUP,
    IFRAME,
    ERRORS,
    UI_EVENT,
    createErrorMessage,
    ConnectSettings,
    Manifest,
    UiResponseEvent,
    CallMethod,
} from '@trezor/connect/lib/exports';
import { factory } from '@trezor/connect/lib/factory';
import { initLog, setLogWriter, LogMessage, LogWriter } from '@trezor/connect/lib/utils/debug';
import { createDeferred } from '@trezor/utils/lib';

import * as popup from './popup';
import { parseConnectSettings } from './connectSettings';

const eventEmitter = new EventEmitter();
let _settings = parseConnectSettings();

/**
 * setup logger.
 * service worker cant communicate directly with sharedworker logger so the communication is as follows:
 * - service worker -> content script -> popup -> sharedworker
 * todo: this could be simplified by injecting additional content script into log.html
 */
const logger = initLog('@trezor/connect-webextension');
const popupManagerLogger = initLog('@trezor/connect-webextension/popupManager');
let _popupManager: popup.PopupManager;

const logWriterFactory = (popupManager: popup.PopupManager): LogWriter => ({
    add: (message: LogMessage) => {
        popupManager.channel.postMessage(
            {
                event: UI_EVENT,
                type: IFRAME.LOG,
                payload: message,
            },
            false,
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

const handshakePromise = createDeferred();

const init = (settings: Partial<ConnectSettings> = {}): Promise<void> => {
    logger.debug('initiating');
    _settings = parseConnectSettings({ ..._settings, ...settings });
    if (!_popupManager) {
        _popupManager = new popup.PopupManager(_settings, { logger: popupManagerLogger });
    }

    setLogWriter(() => logWriterFactory(_popupManager));

    logger.enabled = !!settings.debug;

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    // defaults for connect-webextension
    if (!_settings.transports?.length) {
        _settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }

    _popupManager.channel.on('message', message => {
        if (message.type === POPUP.CORE_LOADED) {
            _popupManager.channel.postMessage({
                type: POPUP.HANDSHAKE,
                // in this case, settings will be validated in popup
                payload: { settings: _settings },
            });
            handshakePromise.resolve();
        }
    });

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
        _popupManager.request();
    }

    await _popupManager.channel.init();
    _popupManager.channel.postMessage({
        type: POPUP.INIT,
        payload: {
            settings: _settings,
            useCore: true,
        },
    });

    await handshakePromise.promise;

    // post message to core in popup
    try {
        const response = await _popupManager.channel.postMessage({
            type: IFRAME.CALL,
            payload: params,
        });

        logger.debug('call: response: ', response);

        if (response) {
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

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
