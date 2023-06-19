import * as electron from 'electron';

import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';
import * as desktopApi from '@trezor/suite-desktop-api';
import { InterceptedEvent } from '@trezor/request-manager';

// define events internally sent between src/modules
interface MainThreadMessages {
    'module/request-interceptor': InterceptedEvent;
}
export const mainThreadEmitter = new TypedEmitter<MainThreadMessages>();

export type StrictIpcMain = desktopApi.StrictIpcMain<
    Omit<Electron.IpcMain, 'handle' | 'handleOnce' | 'removeHandler'>,
    Electron.IpcMainInvokeEvent
>;

export type StrictIpcRenderer = desktopApi.StrictIpcRenderer<
    Omit<electron.IpcRenderer, 'invoke' | 'send'>,
    Electron.Event
>;

export type StrictBrowserWindow = desktopApi.StrictBrowserWindow<
    Electron.BrowserWindow,
    Electron.WebContents
>;

export const { app } = electron;

/* eslint-disable prefer-destructuring */
export const ipcMain: StrictIpcMain = electron.ipcMain;
export const ipcRenderer: StrictIpcRenderer = electron.ipcRenderer;
