/**
When the button's clicked:
- call for TrezorConnect action
- show a notification with response
*/

import TrezorConnect from './TrezorConnect.js';

// try {
//     importScripts('./vendor/trezor-connect.js');
// } catch (err) {
//     console.error(e);
// }

console.log('background script init');

function meow() {
    TrezorConnect.manifest({
        email: 'email@developer.com',
        appUrl: 'webextension-app-boilerplate',
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'open_dialog_box' }, function (response) {});
    });

    chrome.runtime.onMessage.addListener(event => {
        console.log('message in background', event);

        switch (event.message) {
            case 'TrezorConnect.getAddress': {
                TrezorConnect.getAddress({
                    path: "m/49'/0'/0'/0/0",
                }).then(response => {
                    console.log('response', response);

                    const message = response.success
                        ? `BTC Address: ${response.payload.address}`
                        : `Error: ${response.payload.error}`;
                    chrome.notifications.create(new Date().getTime().toString(), {
                        type: 'basic',
                        iconUrl: 'icons/48.png',
                        title: 'TrezorConnect',
                        message,
                    });
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        console.log('sending response to tab', tabs[0]);
                        chrome.tabs.sendMessage(tabs[0].id, response, function (response) {
                            console.log(response);
                        });
                    });

                    chrome.action.setBadgeBackgroundColor(
                        { color: response.success ? 'green' : 'red' },
                        () => {},
                    );
                });
            }
        }
        return true;
    });
}

meow();

chrome.action.onClicked.addListener(tab => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['alert.js'],
    });
});
