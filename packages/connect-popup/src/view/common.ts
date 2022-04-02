// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/common.js

import { POPUP, ERRORS, PopupInit, CoreMessage, ConnectSettings } from '@trezor/connect';

export const header: HTMLElement = document.getElementsByTagName('header')[0];
export const container: HTMLElement = document.getElementById('container')!;
export const views: HTMLElement = document.getElementById('views')!;

type State = {
    settings?: ConnectSettings;
    iframe?: Window;
    broadcast?: BroadcastChannel;
};

let state: State = {};
const channel = new MessageChannel(); // used in direct element communication (iframe.postMessage)

export const setState = (newState: State) => (state = { ...state, ...newState });
export const getState = () => state;

export const setOperation = (operation: string) => {
    const infoPanel = document.getElementsByClassName('info-panel')[0];
    const operationEl = infoPanel.getElementsByClassName('operation')[0];
    const originEl = infoPanel.getElementsByClassName('origin')[0] as HTMLElement;
    operationEl.innerHTML = operation;
    const { settings } = getState();
    originEl.innerText = settings?.hostLabel ?? settings?.origin ?? '';

    const icon = settings?.hostIcon;
    if (icon) {
        const iconContainers = document.getElementsByClassName('service-info');
        for (let i = 0; i < iconContainers.length; i++) {
            iconContainers[i].innerHTML = `<img src="${icon}" alt="" />`;
        }
    }
};

export const createTooltip = (text: string) => {
    const tooltip = document.createElement('div');
    tooltip.setAttribute('tooltip', text);
    tooltip.setAttribute('tooltip-position', 'bottom');

    return tooltip;
};

export const clearView = () => {
    container.innerHTML = '';
};

export const showView = (className: string) => {
    clearView();

    const view = views.getElementsByClassName(className);
    if (view) {
        const viewItem = view.item(0);
        if (viewItem) {
            container.innerHTML = viewItem.outerHTML;
        }
    } else {
        const unknown = views.getElementsByClassName('unknown-view');
        const unknownItem = unknown.item(0);
        if (unknownItem) {
            container.innerHTML = unknownItem.outerHTML;
        }
    }
    return container;
};

export const getIframeElement = () => {
    // try find iframe in opener window
    if (!window.opener) return;
    const { frames } = window.opener;
    if (!frames) return; // electron will return undefined
    let iframe: Window | undefined;
    for (let i = 0; i < frames.length; i++) {
        try {
            // try to get iframe origin, this action will not fail ONLY if the origins of iframe and popup are the same
            if (frames[i].location.host === window.location.host) {
                iframe = frames[i];
            }
        } catch (error) {
            // do nothing, try next entry
        }
    }
    return iframe;
};

// initialize message channel with iframe element
export const initMessageChannel = (
    payload: PopupInit['payload'],
    handler: (e: MessageEvent) => void,
) => {
    // settings received from window.opener (POPUP.INIT) are not considered as safe (they could be injected/modified)
    // settings will be set later on, after POPUP.HANDSHAKE event from iframe
    const { settings } = payload;
    // npm version < 8.1.20 doesn't have it in POPUP.INIT message
    const useBroadcastChannel =
        typeof payload.useBroadcastChannel === 'boolean' ? payload.useBroadcastChannel : true;
    const id = useBroadcastChannel ? `${settings.env}-${settings.timestamp}` : undefined;
    let broadcast: BroadcastChannel | undefined;
    if (id && typeof BroadcastChannel !== 'undefined') {
        try {
            broadcast = new BroadcastChannel(id);
            broadcast.onmessage = handler;
        } catch (error) {
            // silent error. use MessageChannel as fallback communication
        }
    }
    const iframe = getIframeElement();
    if (!broadcast && !iframe) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }
    if (!broadcast) {
        channel.port1.onmessage = handler;
    }

    setState({ iframe, broadcast });
};

// this method can be used from anywhere
export const postMessage = (message: CoreMessage) => {
    const { broadcast, iframe } = getState();
    if (broadcast) {
        broadcast.postMessage(message);
        return;
    }

    if (!iframe) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }

    // First message to iframe, MessageChannel port needs to set here
    if (message.type && message.type === POPUP.HANDSHAKE) {
        iframe.postMessage(message, window.location.origin, [channel.port2]);
        return;
    }
    iframe.postMessage(message, window.location.origin);
};

export const postMessageToParent = (message: CoreMessage) => {
    if (window.opener) {
        // post message to parent and wait for POPUP.INIT message
        window.opener.postMessage(message, '*');
    } else {
        // webextensions doesn't have "window.opener" reference and expect this message in "content-script" above popup [see: ./src/plugins/webextension/trezor-content-script.js]
        // future communication channel with webextension iframe will be "ChromePort"

        // and electron (electron which uses connect hosted outside)
        // https://github.com/electron/electron/issues/7228
        window.postMessage(message, window.location.origin);
    }
};
