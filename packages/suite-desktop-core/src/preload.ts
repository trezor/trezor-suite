import { contextBridge, ipcRenderer } from 'electron';

import { exposeIpcProxy } from '@trezor/ipc-proxy';
import { getDesktopApi } from '@trezor/suite-desktop-api';

import '@sentry/electron/preload'; // With this only IPCMode.Classic is ever taken into account
import { hasSwitch } from './libs/process-switches';

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
