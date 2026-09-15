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

export { type DesktopApiDep, selectDesktopApiDep } from './desktopApiDependency';
