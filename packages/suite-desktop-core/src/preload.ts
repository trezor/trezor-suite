import { contextBridge, ipcRenderer } from 'electron';

import { exposeIpcProxy } from '@trezor/ipc-proxy';
import { getDesktopApi } from '@trezor/suite-desktop-api';

import '@sentry/electron/preload'; // With this only IPCMode.Classic is ever taken into account
import { hasSwitch } from './libs/process-switches';

const cspNonce = process.argv
    .find(p => p.startsWith('--cspNonce'))
    ?.replace('--cspNonce=', '')
    ?.trim();

contextBridge.exposeInMainWorld('cspNonce', cspNonce);

contextBridge.exposeInMainWorld(
    ...exposeIpcProxy(ipcRenderer, [
        'Bluetooth',
        'CoinjoinBackend',
        'CoinjoinClient',
        'TrezorConnect',
    ]),
);

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
contextBridge.exposeInMainWorld('desktopFlags', {
    exposeStore: hasSwitch('expose-store'),
});

contextBridge.exposeInMainWorld('electronFind', {
    onShow: (callback: () => void) => ipcRenderer.on('find:show', callback),
    offShow: (callback: () => void) => ipcRenderer.removeListener('find:show', callback),
});
