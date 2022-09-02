import { contextBridge } from 'electron';
import { getDesktopApi } from '@trezor/suite-desktop-api';
import { exposeIpcProxy } from '@trezor/ipc-proxy';
import { ipcRenderer } from './typed-electron';
import { initTrezorConnectIpcChannel } from './modules/trezor-connect-preload';

import '@sentry/electron/preload'; // __SENTRY_IPC__

initTrezorConnectIpcChannel();

// const coinjoinIpcChannel = {
//     createClientInstance: generateIpcInterface(ipcRenderer as any, 'CoinjoinClient'),
//     createBackendInstance: generateIpcInterface(ipcRenderer as any, 'CoinjoinBackend'),
// };

// contextBridge.exposeInMainWorld('CoinjoinIpcChannel', coinjoinIpcChannel);
contextBridge.exposeInMainWorld(...exposeIpcProxy(ipcRenderer));

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
