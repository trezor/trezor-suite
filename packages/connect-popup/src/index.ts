// REF-TODO remove eslint rules
/* eslint-disable @typescript-eslint/no-use-before-define */

import { POPUP, UI_REQUEST, parseMessage, PopupMessage } from '@trezor/connect';

import { DataManager } from '@trezor/connect/src/data/DataManager';
import { parse as parseSettings } from '@trezor/connect/src/data/ConnectSettings';
import { escapeHtml } from '@trezor/connect/src/utils/windowsUtils';

import * as view from './view';
import { showView, setOperation, initMessageChannel, postMessageToParent } from './view/common';
import {
    showFirmwareUpdateNotification,
    showBridgeUpdateNotification,
    showBackupNotification,
} from './view/notification';

import type { PostMessageEvent, PopupInit, PopupHandshake } from '@trezor/connect';

// handle messages from window.opener and iframe
const handleMessage = (event: PostMessageEvent) => {
    const { data } = event;
    if (!data) return;

    // This is message from the window.opener
    if (data.type === POPUP.INIT) {
        init(escapeHtml(data.payload));
        return;
    }

    // This is message from the window.opener
    if (data.type === UI_REQUEST.IFRAME_FAILURE) {
        showView('iframe-failure');
        return;
    }

    // ignore messages from origin other then MessagePort (iframe)
    const isMessagePort =
        event.target instanceof MessagePort ||
        (typeof BroadcastChannel !== 'undefined' && event.target instanceof BroadcastChannel);
    if (!isMessagePort) return;

    // catch first message from iframe
    if (data.type === POPUP.HANDSHAKE) {
        handshake(data.payload!); // REF-TODO: POPUP.HANDSHAKE is declared in both, ui-request, ui-response
        return;
    }

    const message = parseMessage(data);

    switch (message.type) {
        case UI_REQUEST.LOADING:
            // case UI.REQUEST_UI_WINDOW :
            showView('loader');
            break;
        case UI_REQUEST.SET_OPERATION:
            if (typeof message.payload === 'string') {
                setOperation(message.payload);
            }
            break;
        case UI_REQUEST.TRANSPORT:
            showView('transport');
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
        case UI_REQUEST.FIRMWARE_OUTDATED:
            showFirmwareUpdateNotification(message.payload);
            break;
        case UI_REQUEST.DEVICE_NEEDS_BACKUP:
            showBackupNotification(message.payload);
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
        case UI_REQUEST.REQUEST_PASSPHRASE:
            view.initPassphraseView(message.payload);
            break;
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
const init = async (payload?: PopupInit['payload']) => {
    if (!payload) return;
    const { settings } = payload;
    // npm version < 8.1.20 doesn't have it in POPUP.INIT message
    const useBroadcastChannel =
        typeof payload.useBroadcastChannel === 'boolean' ? payload.useBroadcastChannel : true;

    try {
        // load config only to get supported browsers list
        // settings received from parent (POPUP.INIT) are not considered as "safe" (they could be injected/modified)
        // settings will be replaced later on, after POPUP.HANDSHAKE event from iframe
        await DataManager.load(parseSettings(settings), false);
        // initialize message channel
        const broadcastID = useBroadcastChannel
            ? `${settings.env}-${settings.timestamp}`
            : undefined;
        // REF-TODO types
        // @ts-ignore
        initMessageChannel(broadcastID, handleMessage);
        // reset loading hash
        window.location.hash = '';
        // handshake with iframe
        view.initBrowserView();
    } catch (error) {
        postMessageToParent(PopupMessage(POPUP.ERROR, { error: error.message }));
    }
};

// handle POPUP.HANDSHAKE message from iframe
const handshake = (payload: PopupHandshake['payload']) => {
    if (!payload) return;
    // replace local settings with values from iframe (parent origin etc.)
    DataManager.settings = payload.settings;
    setOperation(payload.method || '');
    if (payload.transport && payload.transport.outdated) {
        showBridgeUpdateNotification();
    }
};

const onLoad = () => {
    // unsupported browser, this hash was set in parent app (PopupManager)
    // display message and do not continue
    if (window.location.hash === '#unsupported') {
        view.initBrowserView(false);
        return;
    }

    postMessageToParent(PopupMessage(POPUP.LOADED));
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);

// global method used in html-inline elements
// REF-TODO: define in global.d.ts?
// @ts-ignore
window.closeWindow = () => {
    setTimeout(() => {
        window.postMessage({ type: POPUP.CLOSE_WINDOW }, window.location.origin);
        window.close();
    }, 100);
};
