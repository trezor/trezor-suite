import { contextBridge } from 'electron';
import { getDesktopApi } from '@trezor/suite-desktop-api';
import { exposeIpcProxy } from '@trezor/ipc-proxy';
import { ipcRenderer } from './typed-electron';

import '@sentry/electron/preload'; // __SENTRY_IPC__

// contextBridge.exposeInMainWorld('CoinjoinIpcChannel', coinjoinIpcChannel);
contextBridge.exposeInMainWorld(
    ...exposeIpcProxy(ipcRenderer, ['CoinjoinClient', 'CoinjoinBackend', 'TrezorConnect']),
);

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
