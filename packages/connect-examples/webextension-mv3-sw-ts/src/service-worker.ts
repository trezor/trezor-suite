/// <reference lib="webworker" />

// import connect
import TrezorConnect, { DEVICE_EVENT } from '@trezor/connect-webextension';

const connectSrc = 'https://connect.trezor.io/9/';

chrome.runtime.onInstalled.addListener(details => {
    console.log('details', details);

    TrezorConnect.init({
        manifest: {
            email: 'meow@example.com',
            appUrl: 'https://yourAppUrl.com/',
        },
        transports: ['WebUsbTransport'],
        connectSrc,
        _extendWebextensionLifetime: true,
    });

    TrezorConnect.on(DEVICE_EVENT, (event: any) => {
        console.log('EVENT in service worker', event);
    });

    // Listen for messages from the connect-manager.html/js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'getAddress') {
            TrezorConnect.getAddress({
                showOnTrezor: true,
                path: "m/49'/0'/0'/0/0",
                coin: 'btc',
            }).then((res: any) => {
                sendResponse(res);
            });
            // Return true to indicate you want to send a response asynchronously
            return true;
        } else if (message.action === 'getFeatures') {
            TrezorConnect.getFeatures().then((res: any) => {
                sendResponse(res);
            });
            // Return true to indicate you want to send a response asynchronously
            return true;
        }
    });
});
