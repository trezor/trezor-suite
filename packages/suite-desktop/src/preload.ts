import { contextBridge } from 'electron';
import { getDesktopApi } from '@trezor/suite-desktop-api';
import { ipcRenderer } from './typed-electron';
import { initTrezorConnectIpcChannel } from './modules/trezor-connect-preload';

import '@sentry/electron/preload';

initTrezorConnectIpcChannel();

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
