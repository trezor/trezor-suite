const TrezorConnect = require('@trezor/connect').default;
const {
    TRANSPORT_EVENT,
    UI,
    UI_EVENT,
    DEVICE_EVENT,
    TRANSPORT,
    DEVICE,
} = require('@trezor/connect');

let inited = false;
// SETUP trezor-connect
exports.initTrezorConnect = sender => {
    if (inited) return; // prevent multiple initialization
    inited = true;

    // Listen to TRANSPORT_EVENT
    TrezorConnect.on(TRANSPORT_EVENT, event => {
        sender.send('trezor-connect', event.type);
        if (event.type === TRANSPORT.ERROR) {
            // trezor-bridge not installed
            sender.send('trezor-connect', 'Transport is missing');
        }
        if (event.type === TRANSPORT.START) {
            sender.send('trezor-connect', event);
        }
    });

    // Listen to DEVICE_EVENT
    TrezorConnect.on(DEVICE_EVENT, event => {
        sender.send('trezor-connect', event.type);

        // not obvious event
        if (event.type === DEVICE.CONNECT_UNACQUIRED) {
            // connected device is unknown or busy
            // most common reasons is that either device is currently used somewhere else
            // or app refreshed during call and trezor-bridge didn't managed to release the session
            // render "Acquire device" button and after click try to fetch device features using:
            // TrezorConnect.getFeatures();
        }
    });

    // Listen to UI_EVENT
    // most common requests
    TrezorConnect.on(UI_EVENT, event => {
        sender.send('trezor-connect', event);

        if (event.type === UI.REQUEST_PIN) {
            // example how to respond to pin request
            TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload: '1234' });
        }

        if (event.type === UI.REQUEST_PASSPHRASE) {
            if (event.payload.device.features.capabilities.includes('Capability_PassphraseEntry')) {
                // device does support entering passphrase on device
                // let user choose where to enter
                // if he choose to do it on device respond with:
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_PASSPHRASE,
                    payload: { passphraseOnDevice: true, value: '' },
                });
            } else {
                // example how to respond to passphrase request from regular UI input (form)
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_PASSPHRASE,
                    payload: { value: 'type your passphrase here', save: true },
                });
            }
        }

        if (event.type === UI.SELECT_DEVICE) {
            if (event.payload.devices.length > 0) {
                // more then one device connected
                // example how to respond to select device
                TrezorConnect.uiResponse({
                    type: UI.RECEIVE_DEVICE,
                    payload: event.payload.devices[0],
                });
            } else {
                // no devices connected, waiting for connection
            }
        }

        // getAddress from device which is not backed up
        // there is a high risk of coin loss at this point
        // warn user about it
        if (event.type === UI.REQUEST_CONFIRMATION) {
            // payload: true - user decides to continue anyway
            TrezorConnect.uiResponse({ type: UI.RECEIVE_CONFIRMATION, payload: true });
        }
    });

    TrezorConnect.init({
        popup: false, // render your own UI
        webusb: false, // webusb is not supported in electron
        debug: false, // see what's going on inside connect
        // lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
        // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
        // this is useful when you don't know if you are dealing with Trezor user
        manifest: {
            email: 'email@developer.com',
            appUrl: 'electron-app-boilerplate',
        },
    })
        .then(() => {
            sender.send('trezor-connect', 'TrezorConnect is ready!');
        })
        .catch(error => {
            sender.send('trezor-connect', `TrezorConnect init error:${error}`);
        });
};

exports.callTrezorConnect = (sender, message) => {
    const { method, params } = message;
    TrezorConnect[method](params).then(response => {
        sender.send('trezor-connect', response);
    });
};
