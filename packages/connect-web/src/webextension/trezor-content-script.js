/*
    Passing messages from background script to popup
*/

let port = chrome.runtime.connect({ name: 'trezor-connect' });

const channel = {
    here: '@trezor/connect-content-script',
    peer: '@trezor/connect-webextension',
};

port.onMessage.addListener(message => {
    // handle channel handshake, temporary solution before refactoring to channel abstraction
    if (message.type === 'channel-handshake-request') {
        port.postMessage({
            channel,
            type: 'channel-handshake-confirm',
            data: { success: true, payload: undefined },
        });
        return;
    }
    window.postMessage(message, window.location.origin);
});

port.onDisconnect.addListener(() => {
    port = null;
});

/*
    Passing messages from popup to background script
*/

window.addEventListener('message', event => {
    if (port && event.source === window && event.data) {
        port.postMessage({
            channel,
            ...event.data,
        });
    }
});
