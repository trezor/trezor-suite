import { factory } from './factory';

export const getDesktopApi = factory;

// desktopApi is available only in ./renderer
export const desktopApi = factory();

export { DesktopApi, MainChannels, RendererChannels, InvokeChannels } from './api';
export { SendMethod, ListenerMethod, InvokeMethod, HandleMethod } from './methods';
export { StrictIpcMain, StrictIpcRenderer, StrictBrowserWindow } from './ipc';
export { SuiteThemeVariant, UpdateInfo, UpdateProgress, InvokeResult } from './messages';
