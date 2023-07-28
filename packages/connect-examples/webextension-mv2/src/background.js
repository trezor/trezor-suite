/**
TrezorConnect is loaded in background script but it is triggered from content script.
- call for TrezorConnect action
- show a notification with response
*/

const DEFAULT_SRC = 'https://connect.trezor.io/9/';

function loadTrezorConnect() {
    return TrezorConnect.init({
        manifest: {
            email: 'email@developer.com',
            appUrl: 'webextension-app-boilerplate',
        },
        connectSrc: DEFAULT_SRC,
    });
}

function getAddress() {
    return TrezorConnect.getAddress({
        path: "m/49'/0'/0'/0/0",
    });
}

async function sendMessageToContentScript(tabID, type, data = null) {
    try {
        const response = await chrome.tabs.sendMessage(tabID, { type, data });
        return response;
    } catch (error) {
        return null;
    }
}

chrome.runtime.onMessage.addListener((message, sender) => {
    const { tab } = sender;
    const { type, data } = message;
    if (type === 'getAddress') {
        getAddress().then(response => {
            const message = response.success
                ? `BTC Address: ${response.payload.address}`
                : `Error: ${response.payload.error}`;
            sendMessageToContentScript(tab.id, 'getAddress', message);
        });
    } else if (type === 'pageLoaded') {
        loadTrezorConnect().then(() => {
            sendMessageToContentScript(tab.id, 'connectLoaded');
        });
    }
});
