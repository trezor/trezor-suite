/* eslint-disable prefer-destructuring */
import * as electron from 'electron';

import * as desktopApi from '@trezor/suite-desktop-api';

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

export const ipcMain: StrictIpcMain = electron.ipcMain;
export const ipcRenderer: StrictIpcRenderer = electron.ipcRenderer;
