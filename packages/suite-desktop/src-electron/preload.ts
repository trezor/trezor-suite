import { contextBridge } from 'electron';
import { getDesktopApi } from '@trezor/suite-desktop-api';
import { ipcRenderer } from './typed-electron';
import { initTrezorConnectIpcChannel } from './modules/trezor-connect-preload';

initTrezorConnectIpcChannel();

const desktopApi = getDesktopApi(ipcRenderer);
contextBridge.exposeInMainWorld('desktopApi', desktopApi);
