// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/popup.js/
import {
    POPUP,
    UI_REQUEST,
    parseMessage,
    createPopupMessage,
    createUiResponse,
    UiEvent,
    PopupEvent,
    PopupInit,
    PopupHandshake,
} from '@trezor/connect';

import { reactEventBus } from '@trezor/connect-ui/src/utils/eventBus';
import { analytics, EventType } from '@trezor/connect-analytics';

import * as view from './view';
import {
    setState,
    showView,
    initMessageChannel,
    postMessageToParent,
    renderConnectUI,
    postMessage,
} from './view/common';
import { isPhishingDomain } from './utils/isPhishingDomain';

let handshakeTimeout: ReturnType<typeof setTimeout>;

// browser built-in functionality to quickly and safely escape the string
const escapeHtml = (payload: any) => {
    if (!payload) return;
    try {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(JSON.stringify(payload)));
        return JSON.parse(div.innerHTML);
    } catch (error) {
        // do nothing
    }
};

// handle messages from window.opener and iframe
const handleMessage = (event: MessageEvent<PopupEvent | UiEvent>) => {
    const { data } = event;

    if (!data) return;

    // This is message from the window.opener
    if (data.type === POPUP.INIT) {
        init(escapeHtml(data.payload)); // eslint-disable-line @typescript-eslint/no-use-before-define
        return;
    }

    // This is message from the window.opener
    if (data.type === UI_REQUEST.IFRAME_FAILURE) {
        reactEventBus.dispatch({
            type: 'error',
            detail: 'iframe-failure',
        });

        return;
    }

    // ignore messages from origin other then MessagePort (iframe)
    const isMessagePort =
        event.target instanceof MessagePort ||
        (typeof BroadcastChannel !== 'undefined' && event.target instanceof BroadcastChannel);
    if (!isMessagePort) return;

    // catch first message from iframe
    if (data.type === POPUP.HANDSHAKE) {
        handshake(data); // eslint-disable-line @typescript-eslint/no-use-before-define
        return;
    }

    const message = parseMessage(data);

    analytics.report({ type: EventType.ViewChange, payload: { nextView: message.type } });

    if (
        message?.payload &&
        typeof message.payload === 'object' &&
        'analytics' in message.payload &&
        message.payload.analytics
    ) {
        analytics.report(message.payload.analytics);
    }

    switch (message.type) {
        case UI_REQUEST.TRANSPORT:
        case UI_REQUEST.FIRMWARE_OUTDATED:
        case UI_REQUEST.DEVICE_NEEDS_BACKUP:
        case UI_REQUEST.REQUEST_PASSPHRASE:
            // todo: I don't have power to solve this now
            // @ts-expect-error
            reactEventBus.dispatch(message);
            // already implemented in react. return here
            return;
        default:
        // no default
    }

    // otherwise we still render in legacy way
    // dispatch empty message to instruct the "reactified"
    // part of app to hide the main content
    reactEventBus.dispatch();

    switch (message.type) {
        case UI_REQUEST.LOADING:
            // case UI.REQUEST_UI_WINDOW :
            showView('loader');
            break;
        case UI_REQUEST.SELECT_DEVICE:
            view.selectDevice(message.payload);
            break;
        case UI_REQUEST.SELECT_ACCOUNT:
            view.selectAccount(message.payload);
            break;
        case UI_REQUEST.SELECT_FEE:
            view.selectFee(message.payload);
            break;
        case UI_REQUEST.UPDATE_CUSTOM_FEE:
            view.updateCustomFee(message.payload);
            break;
        case UI_REQUEST.INSUFFICIENT_FUNDS:
            showView('insufficient-funds');
            break;
        case UI_REQUEST.REQUEST_BUTTON:
            view.requestButton(message.payload);
            break;
        case UI_REQUEST.BOOTLOADER:
            showView('bootloader');
            break;
        case UI_REQUEST.NOT_IN_BOOTLOADER:
            showView('not-in-bootloader');
            break;
        case UI_REQUEST.INITIALIZE:
            showView('initialize');
            break;
        case UI_REQUEST.SEEDLESS:
            showView('seedless');
            break;
        case UI_REQUEST.FIRMWARE_NOT_INSTALLED:
            showView('firmware-install');
            break;
        case UI_REQUEST.FIRMWARE_OLD:
            view.firmwareRequiredUpdate(message.payload);
            break;
        case UI_REQUEST.FIRMWARE_NOT_SUPPORTED:
            view.firmwareNotSupported(message.payload);
            break;
        case UI_REQUEST.FIRMWARE_NOT_COMPATIBLE:
            view.firmwareNotCompatible(message.payload);
            break;
        case UI_REQUEST.REQUEST_PERMISSION:
            view.initPermissionsView(message.payload);
            break;
        case UI_REQUEST.REQUEST_CONFIRMATION:
            view.initConfirmationView(message.payload);
            break;
        case UI_REQUEST.REQUEST_PIN:
            view.initPinView(message.payload);
            break;
        case UI_REQUEST.REQUEST_WORD:
            view.initWordView(message.payload);
            break;
        case UI_REQUEST.INVALID_PIN:
            showView('invalid-pin');
            break;
        // comes when user clicks "enter on device"
        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
            view.passphraseOnDeviceView(message.payload);
            break;
        case UI_REQUEST.INVALID_PASSPHRASE:
            view.initInvalidPassphraseView(message.payload);
            break;
        // no default
    }
};

// handle POPUP.INIT message from window.opener
const init = async (payload: PopupInit['payload']) => {
    if (!payload) return;
    try {
        initMessageChannel(payload, handleMessage);
        // reset loading hash
        window.location.hash = '';

        // handshake with iframe
        const isBrowserSupported = await view.initBrowserView();
        // but only if browser is supported
        if (!isBrowserSupported) {
            return;
        }

        await renderConnectUI();

        postMessage(createUiResponse(POPUP.HANDSHAKE));
    } catch (error) {
        postMessageToParent(createPopupMessage(POPUP.ERROR, { error: error.message }));
    }
};

// handle POPUP.HANDSHAKE message from iframe
const handshake = (handshake: PopupHandshake) => {
    const { payload } = handshake;
    if (!payload) return;

    clearTimeout(handshakeTimeout);

    // use trusted settings from iframe
    setState({ settings: payload.settings });

    reactEventBus.dispatch(handshake);

    analytics.report({
        type: EventType.AppReady,
        payload: {
            version: payload?.settings?.version,
            // reported in IFRAME.INIT. either origin where iframe was initiated or chrome.runtime.id for extensions
            origin: payload?.settings?.origin,
            referrerApp: payload?.settings?.manifest?.appUrl,
            referrerEmail: payload?.settings?.manifest?.email,
            method: payload?.method,
            transportType: payload.transport?.type,
            transportVersion: payload.transport?.version,
        },
    });

    if (isPhishingDomain(payload.settings.origin || '')) {
        reactEventBus.dispatch({ type: 'phishing-domain' });
    }
};

const onLoad = () => {
    // unsupported browser, this hash was set in parent app (PopupManager)
    // display message and do not continue
    if (window.location.hash === '#unsupported') {
        view.initBrowserView(false);
        return;
    }

    postMessageToParent(createPopupMessage(POPUP.LOADED));

    handshakeTimeout = setTimeout(
        () =>
            reactEventBus.dispatch({
                type: 'error',
                detail: 'handshake-timeout',
            }),
        // in theory, a user might have extremely slow internet connection and handshake
        // could be done after this is fired. the question is, should we disallow communication
        // after error screen has been rendered? maybe it would be better to keep loader loading
        // and display some kind of modal instead
        90 * 1000,
    );
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);

// global method used in html-inline elements
// @ts-expect-error not defined in window
window.closeWindow = () => {
    setTimeout(() => {
        window.postMessage({ type: POPUP.CLOSE_WINDOW }, window.location.origin);
        window.close();
    }, 100);
};
