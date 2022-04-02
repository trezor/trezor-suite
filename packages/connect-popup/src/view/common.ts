import { POPUP, ERRORS, CoreMessage } from '@trezor/connect';
import { DataManager } from '@trezor/connect/src/data/DataManager';

export const header: HTMLElement = document.getElementsByTagName('header')[0];
export const container: HTMLElement = document.getElementById('container')!;
export const views: HTMLElement = document.getElementById('views')!;

// eslint-disable-next-line import/no-mutable-exports
export let iframe: any; // TODO: Window type
const channel = new MessageChannel(); // used in direct element communication (iframe.postMessage)
let broadcast: BroadcastChannel | undefined | null = null;

export const setOperation = (operation: string) => {
    const infoPanel = document.getElementsByClassName('info-panel')[0];
    const operationEl = infoPanel.getElementsByClassName('operation')[0];
    const originEl = infoPanel.getElementsByClassName('origin')[0] as HTMLElement;
    operationEl.innerHTML = operation;
    originEl.innerText =
        DataManager.getSettings('hostLabel') || DataManager.getSettings('origin') || '';

    const icon = DataManager.getSettings('hostIcon');
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
    if (!window.opener) return null;
    const { frames } = window.opener;
    if (!frames) return null; // electron will return undefined
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
export const initMessageChannel = (id: string, handler: any) => {
    const hasIframe = getIframeElement();
    if (id && typeof BroadcastChannel !== 'undefined') {
        try {
            broadcast = new BroadcastChannel(id);
            broadcast.onmessage = handler;
        } catch (error) {
            // silent error. use MessageChannel as fallback communication
        }
        return;
    }
    if (!hasIframe) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }
    channel.port1.onmessage = handler;
};

// this method can be used from anywhere
export const postMessage = (message: CoreMessage) => {
    if (!broadcast && !iframe) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }

    if (broadcast) {
        broadcast.postMessage(message);
        return;
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
