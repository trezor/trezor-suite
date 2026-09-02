import {
    type BrowserWindow,
    type Event,
    type IpcRenderer,
    type WebContents,
    app as baseElectronApp,
    ipcRenderer as baseIpcRenderer,
} from 'electron';

import type * as desktopApi from '@trezor/suite-desktop-api';

export type StrictIpcRenderer = desktopApi.StrictIpcRenderer<
    Omit<IpcRenderer, 'invoke' | 'send'>,
    Event
>;

export type StrictBrowserWindow = desktopApi.StrictBrowserWindow<BrowserWindow, WebContents>;

export const app = baseElectronApp;

export const ipcRenderer: StrictIpcRenderer = baseIpcRenderer;
