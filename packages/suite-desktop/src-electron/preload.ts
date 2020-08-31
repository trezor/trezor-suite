import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['restart-app', 'start-bridge', 'oauth-receiver', 'oauth'];

contextBridge.exposeInMainWorld('desktop_api', {
    send: (channel, data) => {
        // whitelist channels
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    off: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.off(channel, (event, ...args) => func(...args));
        }
    },
});
