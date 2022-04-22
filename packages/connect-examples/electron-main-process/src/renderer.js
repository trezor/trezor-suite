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

// click to get public key
const btn = document.getElementById('get-xpub');
btn.onclick = () => {
    // send request to trezor-connect
    window.ipcRenderer.send('trezor-connect', {
        method: 'getPublicKey',
        params: {
            path: "m/49'/0'/0'",
            coin: 'btc',
        },
    });
};

// receive data from TrezorConnect
window.ipcRenderer.on('trezor-connect', (event, message) => {
    printLog(message);
});

// init TrezorConnect in electron main process
window.ipcRenderer.send('trezor-connect', 'init');
