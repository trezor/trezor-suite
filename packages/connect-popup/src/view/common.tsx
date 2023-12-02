// origin: https://github.com/trezor/connect/blob/develop/src/js/popup/view/common.js

import { POPUP, ERRORS, PopupInit, CoreMessage, createUiResponse } from '@trezor/connect';
import { createRoot } from 'react-dom/client';

import { ConnectUI, State, getDefaultState } from '@trezor/connect-ui';
import { StyleSheetWrapper } from './react/StylesSheetWrapper';
import { reactEventBus } from '@trezor/connect-ui/src/utils/eventBus';

export const header: HTMLElement = document.getElementsByTagName('header')[0];
export const container: HTMLElement = document.getElementById('container')!;
export const views: HTMLElement = document.getElementById('views')!;

let state: State = getDefaultState();

export const setState = (newState: Partial<State>) => (state = { ...state, ...newState });
export const getState = () => state;

export const createTooltip = (text: string) => {
    const tooltip = document.createElement('div');
    tooltip.setAttribute('tooltip', text);
    tooltip.setAttribute('tooltip-position', 'bottom');

    return tooltip;
};

export const clearLegacyView = () => {
    // clear and hide legacy views
    const container = document.getElementById('container');
    if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
    }
};

const renderLegacyView = (className: string) => {
    container!.style.display = 'flex';

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

export const showView = (component: string) => {
    reactEventBus.dispatch();
    return renderLegacyView(component);
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
export const initMessageChannelWithIframe = async (
    payload: PopupInit['payload'],
    handler: (e: MessageEvent) => void,
) => {
    // settings received from window.opener (POPUP.INIT) are not considered as safe (they could be injected/modified)
    // settings will be set later on, after POPUP.HANDSHAKE event from iframe
    const { settings, systemInfo, useBroadcastChannel } = payload;

    const handshakeMessage = createUiResponse(POPUP.HANDSHAKE);

    const broadcastId =
        useBroadcastChannel && typeof BroadcastChannel !== 'undefined'
            ? `${settings.env}-${settings.timestamp}`
            : undefined;

    // wait for POPUP.HANDSHAKE message from the iframe or timeout
    const handshakeLoader = (api: Pick<MessagePort, 'addEventListener' | 'removeEventListener'>) =>
        Promise.race([
            new Promise<boolean>(resolve => {
                api.addEventListener('message', function handler(event) {
                    if (event.data.type === POPUP.HANDSHAKE) {
                        api.removeEventListener('message', handler);
                        resolve(true);
                    }
                });
            }),
            new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000)),
        ]);

    const iframe = getIframeElement();
    // Webextension doesn't have iframe element defined here since there is not `window.opener` reference
    // so they only relay on receiving `POPUP.HANDSHAKE` message from iframe to make sure it is available.
    if (!iframe && settings.env !== 'webextension') {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }

    // iframe requested communication via BroadcastChannel.
    if (broadcastId) {
        try {
            // create BroadcastChannel and assign message listener
            const broadcast = new BroadcastChannel(broadcastId);
            broadcast.addEventListener('message', handler);

            // create handshake loader
            const broadcastHandshake = handshakeLoader(broadcast);

            // send POPUP.HANDSHAKE to BroadcastChannel
            broadcast.postMessage(handshakeMessage);

            // POPUP.HANDSHAKE successfully received back from the iframe
            if (await broadcastHandshake) {
                setState({ broadcast, systemInfo, iframe });
                return;
            }

            // otherwise close BroadcastChannel and try to use MessageChannel fallback
            broadcast.close();
            broadcast.removeEventListener('message', handler);
        } catch (error) {
            // silent error. use MessageChannel as fallback communication
        }
    }

    // Depending on some settings of user's browser BroadcastChannel might be unavailable
    // in those cases we use MessageChannel as fallback communication.
    // create MessageChannel and assign message listener
    const channel = new MessageChannel();
    channel.port1.onmessage = handler;

    // create handshake loader
    const iframeHandshake = handshakeLoader(channel.port1);

    if (!iframe) {
        throw ERRORS.TypedError('Popup_ConnectionMissing');
    }

    // send POPUP.HANDSHAKE to iframe with assigned MessagePort
    iframe.postMessage(handshakeMessage, window.location.origin, [channel.port2]);

    // POPUP.HANDSHAKE successfully received back from the iframe
    if (await iframeHandshake) {
        setState({ iframe, systemInfo });
        return;
    }

    throw ERRORS.TypedError('Popup_ConnectionMissing');
};

// this method can be used from anywhere
export const postMessage = (message: CoreMessage) => {
    const { broadcast, iframe, core } = getState();
    if (core) {
        core.handleMessage(message);
        return;
    }
    if (broadcast) {
        broadcast.postMessage(message);
        return;
    }
    if (iframe) {
        iframe.postMessage(message, window.location.origin);
        return;
    }
    throw ERRORS.TypedError('Popup_ConnectionMissing');
};

export const postMessageToParent = (message: CoreMessage) => {
    if (window.opener) {
        // post message to parent and wait for POPUP.INIT message
        window.opener.postMessage(message, '*');
    } else {
        // webextensions doesn't have "window.opener" reference and expect this message in "content-script" above popup [see: packages/connect-web/src/webextension/trezor-content-script.js]
        // future communication channel with webextension iframe will be "ChromePort"

        // and electron (electron which uses connect hosted outside)
        // https://github.com/electron/electron/issues/7228
        window.postMessage(message, window.location.origin);
    }
};

let reactRenderIn;

export const renderConnectUI = () => {
    const reactSlot = document.getElementById('react');

    reactSlot!.style.display = 'flex';
    reactSlot!.style.flex = '1';

    if (!reactSlot!.shadowRoot) {
        reactSlot!.attachShadow({ mode: 'open' });
    }

    reactRenderIn = document.createElement('div');
    reactRenderIn.setAttribute('id', 'reactRenderIn');
    reactRenderIn.style.display = 'flex';
    reactRenderIn.style.flexDirection = 'column';
    reactRenderIn.style.flex = '1';

    // append the renderIn element inside the styleSlot
    reactSlot!.shadowRoot!.appendChild(reactRenderIn);

    const root = createRoot(reactRenderIn);
    const Component = (
        <StyleSheetWrapper>
            <ConnectUI clearLegacyView={clearLegacyView} postMessage={postMessage} />
        </StyleSheetWrapper>
    );

    clearLegacyView();
    root.render(Component);

    return new Promise<void>(resolve => {
        reactEventBus.on(event => {
            if (event?.type === 'connect-ui-rendered') {
                resolve();
            }
        });
    });
};
