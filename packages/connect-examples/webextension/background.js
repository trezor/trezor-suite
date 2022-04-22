/**
When the button's clicked:
- call for TrezorConnect action
- show a notification with response 
*/

TrezorConnect.manifest({
    email: 'email@developer.com',
    appUrl: 'webextension-app-boilerplate',
});

function onClick() {
    TrezorConnect.getAddress({
        path: "m/49'/0'/0'/0/0",
    }).then(response => {
        const message = response.success
            ? `BTC Address: ${response.payload.address}`
            : `Error: ${response.payload.error}`;

        chrome.notifications.create(new Date().getTime().toString(), {
            type: 'basic',
            iconUrl: 'icons/48.png',
            title: 'TrezorConnect',
            message,
        });
    });
}

chrome.browserAction.onClicked.addListener(onClick);
