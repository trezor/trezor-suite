import { contextBridge, ipcRenderer } from 'electron';

import { createDesktopApiBridge } from '@suite/desktop-app-api-electron';
import { exposeIpcProxy } from '@trezor/ipc-proxy';

import '@sentry/electron/preload'; // With this only IPCMode.Classic is ever taken into account
import { hasSwitch } from './libs/process-switches';

const cspNonce = process.argv
    .find(p => p.startsWith('--csp-nonce'))
    ?.replace('--csp-nonce=', '')
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

const desktopApi = createDesktopApiBridge(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
contextBridge.exposeInMainWorld('desktopFlags', {
    exposeStore: hasSwitch('expose-store'),
});
