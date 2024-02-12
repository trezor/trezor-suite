import EventEmitter from 'events';

// NOTE: @trezor/connect part is intentionally not imported from the index so we do include the whole library.
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

import * as popup from './popup';
import { parseConnectSettings } from './connectSettings';
import { ServiceWorkerWindowChannel } from './channels/serviceworker-window';

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
    const oldSettings = parseConnectSettings({
        ..._settings,
    });
    const newSettings = parseConnectSettings({
        ..._settings,
        ...settings,
    });
    // defaults for connect-webextension
    if (!newSettings.transports?.length) {
        newSettings.transports = ['BridgeTransport', 'WebUsbTransport'];
    }
    const equalSettings = JSON.stringify(oldSettings) === JSON.stringify(newSettings);
    _settings = newSettings;

    if (!_popupManager || !equalSettings) {
        if (_popupManager) _popupManager.close();
        _popupManager = new popup.PopupManager(_settings, { logger: popupManagerLogger });
        setLogWriter(() => logWriterFactory(_popupManager));
    }

    logger.enabled = !!settings.debug;

    if (!_settings.manifest) {
        throw ERRORS.TypedError('Init_ManifestMissing');
    }

    _popupManager.channel.on('message', message => {
        if (message.type === POPUP.CORE_LOADED) {
            _popupManager.channel.postMessage({
                type: POPUP.HANDSHAKE,
                // in this case, settings will be validated in popup
                payload: { settings: _settings },
            });
            _popupManager.handshakePromise.resolve();
        }
        if (message.type === POPUP.CLOSED) {
            // When popup is closed we should create a not-real response as if the request was interrupted.
            // Because when popup closes and TrezorConnect is living there it cannot respond, but we know
            // it was interrupted so we safely fake it.
            _popupManager.channel.resolveMessagePromises({
                code: 'Method_Interrupted',
                error: POPUP.CLOSED,
            });
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
        await _popupManager.request();
    }

    await _popupManager.channel.init();
    _popupManager.channel.postMessage({
        type: POPUP.INIT,
        payload: {
            settings: _settings,
            useCore: true,
        },
    });

    await _popupManager.handshakePromise.promise;

    // post message to core in popup
    try {
        const response = await _popupManager.channel.postMessage({
            type: IFRAME.CALL,
            payload: params,
        });

        logger.debug('call: response: ', response);

        if (response) {
            if (_popupManager && response.success) {
                _popupManager.clear();
            }
            return response;
        }

        return createErrorMessage(ERRORS.TypedError('Method_NoResponse'));
    } catch (error) {
        logger.error('call: error', error);
        _popupManager.clear(false);

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

const initProxyChannel = () => {
    const channel = new ServiceWorkerWindowChannel<{
        type: string;
        method: keyof typeof TrezorConnect;
        settings: { manifest: Manifest } & Partial<ConnectSettings>;
    }>({
        name: 'trezor-connect-proxy',
        channel: {
            here: '@trezor/connect-service-worker-proxy',
            peer: '@trezor/connect-foreground-proxy',
        },
        lazyHandshake: true,
        allowSelfOrigin: true,
    });

    let proxySettings: ConnectSettings = parseConnectSettings();

    channel.init();
    channel.on('message', message => {
        const { id, payload, type } = message;
        const { method, settings } = payload;

        if (type === POPUP.INIT) {
            proxySettings = parseConnectSettings({ ..._settings, ...settings });
            return;
        }

        // Core is loaded in popup and initialized every time, so we send the settings from here.
        TrezorConnect.init(proxySettings as { manifest: Manifest } & Partial<ConnectSettings>).then(
            () => {
                (TrezorConnect as any)[method](payload).then((response: any) => {
                    channel.postMessage({
                        id,
                        payload: response.payload,
                    });
                });
            },
        );
    });
};

initProxyChannel();

// eslint-disable-next-line import/no-default-export
export default TrezorConnect;
export * from '@trezor/connect/lib/exports';
