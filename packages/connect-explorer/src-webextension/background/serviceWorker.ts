// empty file so there is a service worker loaded in the extension and id can be used for the e2e tests.
// https://playwright.dev/docs/chrome-extensions#testing

// eslint-disable-next-line no-console
console.log('service worker loaded');

// import connect
importScripts('vendor/trezor-connect-webextension.js');

// call connect once extension is started. and thats all
chrome.runtime.onInstalled.addListener(details => {
    console.log('details', details);
    console.log('TrezorConnect is going to be initialized');
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

const channelName = 'TrezorConnect';
const instanceId = 'test';
const broadcast = new BroadcastChannel(`${channelName}/${instanceId}`);
console.log('broadcast', broadcast);
broadcast.onmessage = event => {
    console.log('event from BroadcastChannel', event);

    const { data } = event;
    const { method, args } = data;

    TrezorConnect[method](...args).then(res => {
        console.log('res', res);
        broadcast.postMessage({ result: res });
    });
};
