const TrezorConnect = require('@trezor/connect').default;
const {
    TRANSPORT_EVENT,
    UI_REQUEST,
    UI_RESPONSE,
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

        if (event.type === UI_REQUEST.REQUEST_PIN) {
            // example how to respond to pin request
            TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_PIN, payload: '1234' });
        }

        if (event.type === UI_REQUEST.REQUEST_PASSPHRASE) {
            if (event.payload.device.features.capabilities.includes('Capability_PassphraseEntry')) {
                // device does support entering passphrase on device
                // let user choose where to enter
                // if he choose to do it on device respond with:
                TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                    payload: { passphraseOnDevice: true, value: '' },
                });
            } else {
                // example how to respond to passphrase request from regular UI input (form)
                TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                    payload: { value: 'type your passphrase here', save: true },
                });
            }
        }

        // getAddress from device which is not backed up
        // there is a high risk of coin loss at this point
        // warn user about it
        if (event.type === UI_REQUEST.REQUEST_CONFIRMATION) {
            // payload: true - user decides to continue anyway
            TrezorConnect.uiResponse({ type: UI_RESPONSE.RECEIVE_CONFIRMATION, payload: true });
        }
    });

    TrezorConnect.init({
        debug: false, // see what's going on inside connect
        manifest: {
            email: 'email@developer.com',
            appName: 'Trezor Connect Example',
            appUrl: 'electron-app-boilerplate',
        },
        transports: ['BridgeTransport'],
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
