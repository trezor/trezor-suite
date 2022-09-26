import { contextBridge, ipcRenderer } from 'electron';
import { exposeIpcProxy } from '@trezor/ipc-proxy';
import { getDesktopApi } from '@trezor/suite-desktop-api';

import '@sentry/electron/preload';

contextBridge.exposeInMainWorld(
    ...exposeIpcProxy(ipcRenderer, ['TrezorConnect', 'CoinjoinBackend', 'CoinjoinClient']),
);

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
