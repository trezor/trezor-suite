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
    PopupEventMessage,
} from '@trezor/connect/lib/exports';
import { factory } from '@trezor/connect/lib/factory';
import { initLog, setLogWriter, LogMessage, LogWriter } from '@trezor/connect/lib/utils/debug';
import { createDeferred } from '@trezor/utils/lib';

import * as popup from './popup';
import { parseConnectSettings } from './connectSettings';
import { ServiceWorkerWindowChannel } from './channels/serviceworker-window';

const eventEmitter = new EventEmitter();
let _settings = parseConnectSettings();
let _popupManager: popup.PopupManager | undefined;

/**
 * setup logger.
 * service worker cant communicate directly with sharedworker logger so the communication is as follows:
 * - service worker -> content script -> popup -> sharedworker
 * todo: this could be simplified by injecting additional content script into log.html
 */
const logger = initLog('@trezor/connect-webextension');
const channelLogger = initLog('@trezor/connect-webextension/serviceWorkerWindowChannel');
const popupManagerLogger = initLog('@trezor/connect-webextension/popupManager');

/**
 * communication channel between service worker and contentScript
 */
const serviceWorkerWindowChannel = new ServiceWorkerWindowChannel<PopupEventMessage>({
    name: 'trezor-connect',
    channel: {
        here: '@trezor/connect-webextension',
        peer: ['@trezor/connect-content-script'],
    },
    logger: channelLogger,
});

const logWriterFactory = (): LogWriter => ({
    add: (message: LogMessage) => {
        serviceWorkerWindowChannel.sendFn({
            event: UI_EVENT,
            type: IFRAME.LOG,
            payload: message,
        });
    },
});

setLogWriter(logWriterFactory);

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

    logger.enabled = !!settings.debug;

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    // defaults for connect-webextension
    if (!_settings.transports?.length) {
        _settings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }

    serviceWorkerWindowChannel.on('message', message => {
        if (message.type === POPUP.CORE_LOADED) {
            serviceWorkerWindowChannel.postMessage({
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
    if (_settings.popup && _popupManager) {
        _popupManager.request();
    }

    await serviceWorkerWindowChannel.init();
    serviceWorkerWindowChannel.postMessage({
        type: POPUP.INIT,
        payload: {
            settings: _settings,
            useCore: true,
        },
    });

    await handshakePromise.promise;

    // post message to core in popup
    try {
        const response = await serviceWorkerWindowChannel.postMessage({
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
        if (_popupManager) {
            _popupManager.clear();
        }
        return createErrorMessage(error);
    }
};

const uiResponse = (response: UiResponseEvent) => {
    const { type, payload } = response;
    serviceWorkerWindowChannel.postMessage({ event: UI_EVENT, type, payload });
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
