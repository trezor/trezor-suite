import { WindowServiceWorkerChannel } from '@trezor/connect-web/src/channels/window-serviceworker';
import { POPUP } from '@trezor/connect/src/events/popup';
import { CONTENT_SCRIPT_VERSION } from '@trezor/connect/src/data/version';

function trezorContentScript() {
    // Check if extension ID matches the popup URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetExtensionId = urlParams.get('extension-id');
    if (targetExtensionId && targetExtensionId !== chrome.runtime.id) {
        return;
    }

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

    /**
     * Firefox enforces some restrictions on the content script that force us to use clones of objects when passing them between the content script and the background script
     */
    function clone(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    /*
     * Passing messages from popup to service worker
     */
    window.addEventListener('message', event => {
        if (event.data?.channel?.here === '@trezor/connect-webextension') {
            return;
        }
        if (event.data?.type === POPUP.LOADED) {
            window.postMessage(
                {
                    type: POPUP.CONTENT_SCRIPT_LOADED,
                    payload: {
                        ...chrome.runtime.getManifest(),
                        id: chrome.runtime.id,
                        contentScriptVersion: CONTENT_SCRIPT_VERSION,
                    },
                },
                window.location.origin,
            );
        }

        if (event.source === window && event.data) {
            if (channelReady) {
                channel.postMessage(clone(event.data), { usePromise: false });
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
            window.postMessage(clone(message), window.location.origin);
        });

        // Send messages that have gathered before the channel was initialized
        while (messagesQueue.length > 0) {
            const message = messagesQueue.shift();
            channel.postMessage(clone(message), { usePromise: false });
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
}

trezorContentScript();
