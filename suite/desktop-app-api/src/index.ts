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
    InAppBrowserBounds,
    InAppBrowserHostEvent,
    InAppBrowserOpenPayload,
    LegacyOriginDatabase,
    LegacyOriginDatabaseDefinition,
    LegacyOriginExportFailedMessage,
    LegacyOriginExportFinishedMessage,
    LegacyOriginExportObjectStoreMessage,
    LegacyOriginFile,
    LegacyOriginIndexDefinition,
    LegacyOriginKey,
    LegacyOriginObjectStore,
    LegacyOriginObjectStoreDefinition,
    LegacyOriginRecord,
    LegacyOriginStorage,
    LegacyOriginStorageImportReport,
} from './messages';
export {
    inAppBrowserBounds,
    inAppBrowserOpenPayload,
    legacyOriginExportFailedMessage,
    legacyOriginExportFinishedMessage,
    legacyOriginExportObjectStoreMessage,
    legacyOriginFile,
    legacyOriginStorageImportReport,
} from './messages';
export { LEGACY_ORIGIN_RECORDS_PER_MESSAGE } from './legacyOriginExportLimits';

export { type DesktopApiDep, injectDesktopApi } from './desktopApiDependency';
