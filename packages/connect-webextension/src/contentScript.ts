import { WindowServiceWorkerChannel } from './channels/window-serviceworker';

/**
 * communication between service worker and both webextension and popup manager
 */
const channel = new WindowServiceWorkerChannel({
    name: 'trezor-connect',
    channel: {
        here: '@trezor/connect-content-script',
        peer: ['@trezor/connect-webextension', '@trezor/connect-popup-manager'],
    },
});

channel.init().then(() => {
    // once script is loaded. send information about the webextension that injected it into the popup
    window.postMessage(
        {
            type: 'popup-content-script-loaded',
            payload: { ...chrome.runtime.getManifest(), id: chrome.runtime.id },
        },
        window.location.origin,
    );

    /**
     * Passing messages from service worker to popup
     */
    channel.on('message', message => {
        window.postMessage(message, window.location.origin);
    });

    /*
     * Passing messages from popup to service worker
     */
    window.addEventListener('message', event => {
        if (
            event.data?.channel?.here === '@trezor/connect-webextension' ||
            event.data?.type === 'content-script-loaded'
        ) {
            return;
        }
        if (event.source === window && event.data) {
            channel.sendFn(event.data);
        }
    });
});
