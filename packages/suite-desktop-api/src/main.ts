import { factory } from './factory';

export const getDesktopApi = factory;

// desktopApi is available only in ./renderer
export const desktopApi = factory();

export type { DesktopApi, MainChannels, RendererChannels, InvokeChannels } from './api';
export type { SendMethod, ListenerMethod, InvokeMethod, HandleMethod } from './methods';
export type { StrictIpcMain, StrictIpcRenderer, StrictBrowserWindow } from './ipc';
export type {
    SuiteThemeVariant,
    UpdateInfo,
    UpdateProgress,
    InvokeResult,
    HandshakeClient,
    HandshakeElectron,
    HandshakeEvent,
    BootstrapTorEvent,
    TorStatusEventType,
    TorStatusEvent,
} from './messages';
