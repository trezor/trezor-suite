/* eslint-disable no-underscore-dangle, @typescript-eslint/no-use-before-define */

// origin: https://github.com/trezor/connect/blob/develop/src/js/iframe/iframe.js

import {
    CORE_EVENT,
    RESPONSE_EVENT,
    UI_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    TRANSPORT,
    POPUP,
    IFRAME,
    UI,
    DEVICE,
    parseMessage,
    createResponseMessage,
    createIFrameMessage,
    createPopupMessage,
    IFrameInit,
    DeviceEvent,
    CoreMessage,
    PostMessageEvent,
} from '@trezor/connect';
import { Core, initCore, initTransport } from '@trezor/connect/src/core';
import { DataManager } from '@trezor/connect/src/data/DataManager';
import { config } from '@trezor/connect/src/data/config';
import { initLog, LogWriter, initLogWriter } from '@trezor/connect/src/utils/debug';
import { getOrigin } from '@trezor/connect/src/utils/urlUtils';
import { suggestBridgeInstaller } from '@trezor/connect/src/data/transportInfo';
import { suggestUdevInstaller } from '@trezor/connect/src/data/udevInfo';
import { storage, getSystemInfo, getInstallerPackage } from '@trezor/connect-common';
import { parseConnectSettings, isOriginWhitelisted } from './connectSettings';
import { analytics, EventType } from '@trezor/connect-analytics';

let _core: Core | undefined;

// custom log
const _log = initLog('IFrame');
let logWriterProxy: LogWriter | undefined;

let _popupMessagePort: (MessagePort | BroadcastChannel) | undefined;

// Wrapper which listens to events from Core

// since iframe.html needs to send message via window.postMessage
// we need to listen to events from Core and convert it to simple objects possible to send over window.postMessage

const handleMessage = async (event: PostMessageEvent) => {
    // ignore messages from myself (chrome bug?)
    if (event.source === window || !event.data) return;
    const { data } = event;
    const id = typeof data.id === 'number' ? data.id : 0;

    const fail = (error: string) => {
        postMessage(createResponseMessage(id, false, { error }));
        postMessage(createPopupMessage(POPUP.CANCEL_POPUP_REQUEST));
    };

    if (data.type === IFRAME.LOG && data.payload.prefix === '@trezor/connect-web') {
        if (logWriterProxy) {
            logWriterProxy.add(data.payload);
        }
        return;
    }

    // respond to call
    // TODO: instead of error _core should be initialized automatically
    if (!_core && data.type === IFRAME.CALL) {
        fail('Core not initialized yet!');
        return;
    }

    // catch first message from window.opener
    if (data.type === IFRAME.INIT) {
        init(data.payload, event.origin);
        return;
    }

    // popup handshake initialization process, get reference to message channel
    if (data.type === POPUP.HANDSHAKE && event.origin === window.location.origin) {
        // check if message was received via BroadcastChannel (persistent default channel. see "init")
        // or reassign _popupMessagePort to current MessagePort (dynamic channel. created by popup. see @trezor/connect-popup initMessageChannel)
        // event.target === BroadcastChannel only in if message was sent via BroadcastChannel otherwise event.target = Window message was send via iframe.postMessage
        if (event.target !== _popupMessagePort) {
            if (event.ports?.length < 1) {
                fail('POPUP.HANDSHAKE: popupMessagePort not found');
                return;
            }
            // reassign to current MessagePort
            [_popupMessagePort] = event.ports;
        }

        if (!_core) {
            fail('POPUP.HANDSHAKE: Core not initialized');
            return;
        }

        const transport = _core.getTransportInfo();
        const settings = DataManager.getSettings();

        postMessage(
            createPopupMessage(POPUP.HANDSHAKE, {
                settings: DataManager.getSettings(),
                transport,
            }),
        );
        _log.debug('loading current method');
        const method = await _core.getCurrentMethod();
        (method.initAsyncPromise ? method.initAsyncPromise : Promise.resolve()).finally(() => {
            if (method.info) {
                postMessage(
                    createPopupMessage(POPUP.METHOD_INFO, {
                        method: method.name,
                        info: method.info, // method.info might change based on initAsync
                    }),
                );
            }

            // eslint-disable-next-line camelcase
            const { tracking_enabled, tracking_id } = storage.load();

            analytics.init(tracking_enabled, {
                // eslint-disable-next-line camelcase
                instanceId: tracking_id,
                commitId: process.env.COMMIT_HASH || '',
                isDev: process.env.NODE_ENV === 'development',
            });

            analytics.report({
                type: EventType.AppReady,
                payload: {
                    version: settings?.version,
                    origin: settings?.origin,
                    referrerApp: settings?.manifest?.appUrl,
                    referrerEmail: settings?.manifest?.email,
                    method: method.name,
                    payload: method.payload ? Object.keys(method.payload) : undefined,
                    transportType: transport?.type,
                    transportVersion: transport?.version,
                },
            });
        });
    }

    // clear reference to popup MessagePort
    if (data.type === POPUP.CLOSED) {
        if (_popupMessagePort instanceof MessagePort) {
            _popupMessagePort = undefined;
        }
    }

    if (data.type === POPUP.ANALYTICS_RESPONSE) {
        if (data.payload.enabled) {
            analytics.enable();
        } else {
            analytics.disable();
        }
    }

    // is message from popup or extension
    const whitelist = isOriginWhitelisted(event.origin);
    const isTrustedDomain = event.origin === window.location.origin || !!whitelist;

    // ignore messages from domain other then parent.window or popup.window or chrome extension
    const eventOrigin = getOrigin(event.origin);
    if (
        !isTrustedDomain &&
        eventOrigin !== DataManager.getSettings('origin') &&
        eventOrigin !== getOrigin(document.referrer)
    )
        return;

    const message = parseMessage(data);

    // prevent from passing event up
    event.preventDefault();
    event.stopImmediatePropagation();

    const safeMessages: CoreMessage['type'][] = [
        IFRAME.CALL,
        POPUP.CLOSED,
        // UI.CHANGE_SETTINGS,
        UI.LOGIN_CHALLENGE_RESPONSE,
        TRANSPORT.DISABLE_WEBUSB,
    ];

    if (!isTrustedDomain && safeMessages.indexOf(message.type) === -1) {
        return;
    }

    // pass data to Core
    if (_core) {
        _core.handleMessage(message);
    }
};

// Communication with 3rd party window and Trezor Popup.
const postMessage = (message: CoreMessage) => {
    _log.debug('postMessage', message);

    const usingPopup = DataManager.getSettings('popup');
    const trustedHost = DataManager.getSettings('trustedHost');
    const handshake = message.type === IFRAME.LOADED;

    // popup handshake is resolved automatically
    if (!usingPopup) {
        if (_core && message.type === UI.REQUEST_UI_WINDOW) {
            _core.handleMessage({ event: UI_EVENT, type: POPUP.HANDSHAKE });
            return;
        }
        if (message.type === POPUP.CANCEL_POPUP_REQUEST) {
            return;
        }
    }

    if (!trustedHost && !handshake && message.event === TRANSPORT_EVENT) {
        return;
    }
    // check if permissions to read from device is granted
    if (!trustedHost && message.event === DEVICE_EVENT && !filterDeviceEvent(message)) {
        return;
    }

    if (message.event === TRANSPORT_EVENT) {
        // add preferred bridge installer
        const platform = getInstallerPackage();
        message.payload.bridge = suggestBridgeInstaller(platform);
        message.payload.udev = suggestUdevInstaller(platform);
    }

    if (usingPopup && _popupMessagePort) {
        _popupMessagePort.postMessage(message);
    }

    if (!usingPopup || shouldUiEventBeSentToHost(message)) {
        let origin = DataManager.getSettings('origin');
        if (!origin || origin.indexOf('file://') >= 0) origin = '*';
        window.parent.postMessage(message, origin);
    }
};

const shouldUiEventBeSentToHost = (message: CoreMessage) => {
    // whitelistedMessages are messages that are sent to 3rd party/host/parent.
    const whitelistedMessages: CoreMessage['type'][] = [
        IFRAME.LOADED,
        IFRAME.ERROR,
        POPUP.CANCEL_POPUP_REQUEST,
        UI.CLOSE_UI_WINDOW,
        UI.LOGIN_CHALLENGE_REQUEST,
        UI.BUNDLE_PROGRESS,
        UI.ADDRESS_VALIDATION,
        RESPONSE_EVENT,
        DEVICE.CONNECT,
        DEVICE.CONNECT_UNACQUIRED,
        DEVICE.CHANGED,
        DEVICE.DISCONNECT,
        DEVICE.BUTTON,
    ];
    return whitelistedMessages.includes(message.type);
};

const filterDeviceEvent = (message: DeviceEvent) => {
    if (!message.payload) return false;
    const features =
        'device' in message.payload ? message.payload.device.features : message.payload.features;
    if (features) {
        const savedPermissions = storage.load().permissions || storage.load(true).permissions;
        if (savedPermissions) {
            const devicePermissions = savedPermissions.filter(
                p =>
                    p.origin === DataManager.getSettings('origin') &&
                    p.type === 'read' &&
                    p.device === features.device_id,
            );
            return devicePermissions.length > 0;
        }
    }
    return false;
};

const init = async (payload: IFrameInit['payload'], origin: string) => {
    if (DataManager.getSettings('origin')) return; // already initialized
    const parsedSettings = parseConnectSettings(
        {
            ...payload.settings,
            extension: payload.extension,
        },
        origin,
    );

    if (parsedSettings.popup && typeof BroadcastChannel !== 'undefined') {
        // && parsedSettings.env !== 'web'
        const broadcastID = `${parsedSettings.env}-${parsedSettings.timestamp}`;
        try {
            // Firefox > Privacy & Security > block cookies from unvisited websites
            // throws DOMException: The operation is insecure.
            _popupMessagePort = new BroadcastChannel(broadcastID);
            _popupMessagePort.onmessage = message => handleMessage(message);
        } catch (error) {
            // tell the popup to use MessageChannel fallback communication (thru IFRAME.LOADED > POPUP.INIT)
        }
    }

    let logWriterFactory;
    if (parsedSettings.sharedLogger !== false) {
        logWriterFactory = initLogWriter(
            // Use shared logger worker from the same origin as iframe.html
            `${parsedSettings.origin}/workers/shared-logger-worker.js`,
        );
        // `logWriterProxy` is used here to pass to shared logger worker logs from
        // environments that do not have access to it, like connect-web, webextension.
        // It does not log anything in this environment, just used as proxy.
        logWriterProxy = logWriterFactory();
    }

    _log.enabled = !!parsedSettings.debug;

    try {
        // initialize core
        _core = await initCore(parsedSettings, logWriterFactory);
        _core.on(CORE_EVENT, postMessage);

        // initialize transport and wait for the first transport event (start or error)
        await initTransport(parsedSettings);
        postMessage(
            createIFrameMessage(IFRAME.LOADED, {
                useBroadcastChannel: !!_popupMessagePort,
                systemInfo: getSystemInfo(config.supportedBrowsers),
            }),
        );
    } catch (error) {
        postMessage(createIFrameMessage(IFRAME.ERROR, { error }));
    }
};

window.addEventListener('message', handleMessage, false);
window.addEventListener('unload', () => {
    if (_core) {
        _core.dispose();
    }
});
