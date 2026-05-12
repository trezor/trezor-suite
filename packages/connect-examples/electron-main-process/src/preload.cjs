const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('TrezorConnect', {
    init: () => ipcRenderer.send('trezor-connect', 'init'),
    receive: fn => ipcRenderer.on('trezor-connect', fn),
    send: data => ipcRenderer.send('trezor-connect', data),
});
