// import connect
importScripts('vendor/trezor-connect-webextension.js');

// call connect once extension is started. and thats all
chrome.runtime.onInstalled.addListener(details => {
    TrezorConnect.init({
        manifest: {
            email: 'meow',
            appUrl: 'http://localhost:8088',
        },
        transports: ['BridgeTransport', 'WebUsbTransport'],
        connectSrc: 'http://localhost:8088/',
    });

    TrezorConnect.on('DEVICE_EVENT', event => {
        console.log('EVENT in service worker', event);
    });
    TrezorConnect.ethereumGetAddress({
        path: "m/44'/60'/0'/0/0",
        showOnTrezor: true,
    }).then(res => {
        console.log('RESULT in service worker', res);
    });
});
