import { ListenerMethod, SendMethod, InvokeMethod } from './methods';
import {
    SuiteThemeVariant,
    HandshakeInit,
    HandshakeClient,
    HandshakeElectron,
    HandshakeEvent,
    LoggerConfig,
    UpdateInfo,
    UpdateProgress,
    InvokeResult,
    BootstrapTorEvent,
    HandshakeTorModule,
    TorStatusEvent,
    Status,
    BridgeSettings,
    TorSettings,
} from './messages';

// Event messages from renderer to main process
// Sent by DesktopApi.[method] via ipcRenderer.send (see ./main)
// Handled by ipcMain.on (see packages/suite-desktop/src/modules/*)
export interface MainChannels {
    'app/restart': void;
    'app/focus': void;
    'app/hide': void;
    'app/auto-start': boolean;
    'store/clear': void;
    'theme/change': SuiteThemeVariant;
    'tor/get-status': void;
    'update/allow-prerelease': boolean;
    'update/set-automatic-update-enabled': boolean;
    'update/cancel': void;
    'update/check': boolean | undefined;
    'update/download': void;
    'update/install': void;
    'logger/config': LoggerConfig;
}

// Event messages from main to renderer process
// Sent by mainWindow.webContents.send (see packages/suite-desktop/src/modules/*)
// Handled by DesktopApi.on/once (see ./main)
export interface RendererChannels {
    // oauth
    'oauth/response': { [key: string]: string };

    // Update events
    'update/checking': void;
    'update/available': UpdateInfo;
    'update/not-available': UpdateInfo;
    'update/error': Error;
    'update/downloading': UpdateProgress;
    'update/downloaded': UpdateInfo;
    'update/allow-prerelease': boolean;
    'update/set-automatic-update-enabled': boolean;

    // tor
    'tor/status': TorStatusEvent;
    'tor/bootstrap': BootstrapTorEvent;
    'tor/settings': TorSettings;

    // custom protocol
    'protocol/open': string;

    // bridge
    'bridge/status': Status;
    'bridge/settings': BridgeSettings;

    'handshake/event': HandshakeEvent;
}

// Invocation from renderer process
// Sent by DesktopApi.[method] via ipcRenderer.invoke (./main)
// Handled by ipcMain.handle (see packages/suite-desktop/src/modules/*)
export interface InvokeChannels {
    'handshake/client': () => HandshakeInit;
    'handshake/load-modules': (payload: HandshakeClient) => InvokeResult<HandshakeElectron>;
    'handshake/load-tor-module': () => HandshakeTorModule;
    'metadata/read': (options: { file: string }) => InvokeResult<string>;
    'metadata/write': (options: { file: string; content: string }) => InvokeResult;
    'metadata/get-files': () => InvokeResult<string[]>;
    'metadata/rename-file': (options: { file: string; to: string }) => InvokeResult;
    'server/request-address': (route: string) => string | undefined;
    'tor/toggle': (shouldEnableTor: boolean) => InvokeResult;
    'tor/change-settings': (payload: TorSettings) => InvokeResult;
    'tor/get-settings': () => InvokeResult<TorSettings>;
    'bridge/toggle': () => InvokeResult;
    'bridge/get-status': () => InvokeResult<Status>;
    'bridge/change-settings': (payload: BridgeSettings) => InvokeResult;
    'bridge/get-settings': () => InvokeResult<BridgeSettings>;
    'user-data/clear': () => InvokeResult;
    'user-data/open': (directory?: string) => InvokeResult;
    'udev/install': () => InvokeResult;
    'app/auto-start/is-enabled': () => InvokeResult<boolean>;
}

type DesktopApiListener = ListenerMethod<RendererChannels>;

type DesktopApiSend<K extends keyof MainChannels> = SendMethod<{ 0: MainChannels[K] }>;

type DesktopApiInvoke<K extends keyof InvokeChannels> = InvokeMethod<{ 0: InvokeChannels[K] }>;

export interface DesktopApi {
    available: boolean;
    on: DesktopApiListener;
    once: DesktopApiListener;
    removeAllListeners: (channel: keyof RendererChannels) => void;
    // App
    appRestart: DesktopApiSend<'app/restart'>;
    appFocus: DesktopApiSend<'app/focus'>;
    appHide: DesktopApiSend<'app/hide'>;
    appAutoStart: DesktopApiSend<'app/auto-start'>;
    getAppAutoStartIsEnabled: DesktopApiInvoke<'app/auto-start/is-enabled'>;
    // Auto-updater
    checkForUpdates: DesktopApiSend<'update/check'>;
    downloadUpdate: DesktopApiSend<'update/download'>;
    installUpdate: DesktopApiSend<'update/install'>;
    cancelUpdate: DesktopApiSend<'update/cancel'>;
    allowPrerelease: DesktopApiSend<'update/allow-prerelease'>;
    setAutomaticUpdateEnabled: DesktopApiSend<'update/set-automatic-update-enabled'>;
    // Theme
    themeChange: DesktopApiSend<'theme/change'>;
    // Handshake
    handshake: DesktopApiInvoke<'handshake/client'>;
    loadModules: DesktopApiInvoke<'handshake/load-modules'>;
    loadTorModule: DesktopApiInvoke<'handshake/load-tor-module'>;
    // Metadata
    metadataWrite: DesktopApiInvoke<'metadata/write'>;
    metadataRead: DesktopApiInvoke<'metadata/read'>;
    metadataGetFiles: DesktopApiInvoke<'metadata/get-files'>;
    metadataRenameFile: DesktopApiInvoke<'metadata/rename-file'>;

    // HttpReceiver
    getHttpReceiverAddress: DesktopApiInvoke<'server/request-address'>;
    // Tor
    getTorStatus: DesktopApiSend<'tor/get-status'>;
    toggleTor: DesktopApiInvoke<'tor/toggle'>;
    changeTorSettings: DesktopApiInvoke<'tor/change-settings'>;
    getTorSettings: DesktopApiInvoke<'tor/get-settings'>;
    // Store
    clearStore: DesktopApiSend<'store/clear'>;
    clearUserData: DesktopApiInvoke<'user-data/clear'>;
    openUserDataDirectory: DesktopApiInvoke<'user-data/open'>;
    // Udev rules
    installUdevRules: DesktopApiInvoke<'udev/install'>;
    // Logger
    configLogger: DesktopApiSend<'logger/config'>;
    // Bridge
    getBridgeStatus: DesktopApiInvoke<'bridge/get-status'>;
    toggleBridge: DesktopApiInvoke<'bridge/toggle'>;
    changeBridgeSettings: DesktopApiInvoke<'bridge/change-settings'>;
    getBridgeSettings: DesktopApiInvoke<'bridge/get-settings'>;
}
