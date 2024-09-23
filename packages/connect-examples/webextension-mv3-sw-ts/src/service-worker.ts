/// <reference lib="webworker" />
// Reference the Web Worker library, allowing TypeScript to recognize service worker globals

// Import using ES6 module TrezorConnect and the DEVICE_EVENT constant from the Trezor Connect WebExtension package
import TrezorConnect from '@trezor/connect-webextension';

// URL of the Trezor Connect
const connectSrc = 'https://connect.trezor.io/9/';

chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
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
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
