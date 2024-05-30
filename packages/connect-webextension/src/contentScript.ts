import { WindowServiceWorkerChannel } from '@trezor/connect-web/src/channels/window-serviceworker';
import { POPUP } from '@trezor/connect/src/events/popup';

/**
 * communication between service worker and both webextension and popup manager
 */
const channel = new WindowServiceWorkerChannel({
    name: 'trezor-connect',
    channel: {
        here: '@trezor/connect-content-script',
        peer: '@trezor/connect-webextension',
    },
});

/**
 * messages that were sent before the channel was initialized
 */
const messagesQueue: any[] = [];
let channelReady = false;

/*
 * Passing messages from popup to service worker
 */
window.addEventListener('message', event => {
    if (
        event.data?.channel?.here === '@trezor/connect-webextension' ||
        event.data?.type === POPUP.CONTENT_SCRIPT_LOADED
    ) {
        return;
    }
    if (event.data?.type === POPUP.LOADED) {
        window.postMessage(
            {
                type: POPUP.CONTENT_SCRIPT_LOADED,
                payload: { ...chrome.runtime.getManifest(), id: chrome.runtime.id },
            },
            window.location.origin,
        );
    }

    if (event.source === window && event.data) {
        if (channelReady) {
            channel.postMessage(event.data, { usePromise: false });
        } else {
            messagesQueue.push(event.data);
        }
    }
});

channel.init().then(() => {
    channelReady = true;

    /**
     * Passing messages from service worker to popup
     */
    channel.on('message', message => {
        window.postMessage(message, window.location.origin);
    });

    // Send messages that have gathered before the channel was initialized
    while (messagesQueue.length > 0) {
        const message = messagesQueue.shift();
        channel.postMessage(message, { usePromise: false });
    }

    window.addEventListener('beforeunload', () => {
        window.postMessage(
            {
                type: POPUP.CLOSED,
            },
            window.location.origin,
        );
    });
});
