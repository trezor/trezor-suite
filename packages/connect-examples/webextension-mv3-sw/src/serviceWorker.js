// Dynamic script loading to import the Trezor Connect script, making its functions available in this service worker.
// This is designed to work within the service-worker context, which does not support ES6 modules natively.
importScripts('vendor/trezor-connect-webextension.js');

// URL of the Trezor Connect
const connectSrc = 'https://connect.trezor.io/9/';

chrome.runtime.onInstalled.addListener(details => {
    console.log('details', details);

    // Initialize Trezor Connect with the provided manifest and settings
    TrezorConnect.init({
        manifest: {
            email: 'meow@example.com',
            appUrl: 'https://yourAppUrl.com/',
        },
        transports: ['BridgeTransport', 'WebUsbTransport'], // Transport protocols to be used
        connectSrc,
        _extendWebextensionLifetime: true, // Makes the service worker in @trezor/connect-webextension stay alive longer.
    });

    // Event listener for messages from other parts of the extension
    // This code will depend on how you handle the communication between different parts of your webextension.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'getAddress') {
            TrezorConnect.getAddress({
                showOnTrezor: true,
                path: "m/49'/0'/0'/0/0",
                coin: 'btc',
            }).then(res => {
                sendResponse(res); // Send the response back to the sender
            });
            // Return true to indicate you want to send a response asynchronously
            return true;
        } else if (message.action === 'getFeatures') {
            TrezorConnect.getFeatures().then(res => {
                sendResponse(res); // Send the response back to the sender
            });
            // Return true to indicate you want to send a response asynchronously
            return true;
        }
    });
});
