import { createWebDesktopApi } from './createWebDesktopApi';
import { factory } from './factory';

// Used by the preload script to build the API around the real `ipcRenderer`.
export const getDesktopApi = factory;

// The Electron bridge exists only in ./renderer; Node context gets the unavailable implementation.
export const desktopApi = createWebDesktopApi();

export { createElectronDesktopApi } from './createElectronDesktopApi';
export { createWebDesktopApi } from './createWebDesktopApi';
export { type DesktopApiDep, selectDesktopApiDep } from './desktopApiDependency';

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
    TorStatusEvent,
    HandshakeTorModule,
    BridgeSettings,
    ConnectPopupResponse,
    Status,
    TorSettings,
    TraySettings,
} from './messages';
