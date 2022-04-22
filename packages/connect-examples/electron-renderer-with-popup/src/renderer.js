// TrezorConnect is injected as inline script in html
// therefore it doesn't need to included into node_modules
// get reference straight from window object
const { TrezorConnect } = window;

// print log helper
const printLog = data => {
    const log = document.getElementById('log');
    const current = log.value;
    if (current.length > 0) {
        log.value = `${JSON.stringify(data)}\n\n${current}`;
    } else {
        log.value = JSON.stringify(data);
    }
};

// SETUP trezor-connect

// Listen to DEVICE_EVENT
// this event will be emitted only after user grants permission to communicate with this app
TrezorConnect.on('DEVICE_EVENT', event => {
    printLog(event);
});

// Initialize TrezorConnect
TrezorConnect.init({
    webusb: false, // webusb is not supported in electron
    debug: false, // see whats going on inside iframe
    lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
    // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
    // this is useful when you don't know if you are dealing with Trezor user
    manifest: {
        email: 'email@developer.com',
        appUrl: 'electron-app-boilerplate',
    },
})
    .then(() => {
        printLog('TrezorConnect is ready!');
    })
    .catch(error => {
        printLog(`TrezorConnect init error: ${error}`);
    });

// click to get public key
const btn = document.getElementById('get-xpub');
btn.onclick = () => {
    TrezorConnect.getPublicKey({
        path: "m/49'/0'/0'",
        coin: 'btc',
    }).then(response => {
        printLog(response);
    });
};
