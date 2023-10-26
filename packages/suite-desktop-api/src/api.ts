import { ListenerMethod, SendMethod, InvokeMethod } from './methods';
import {
    SuiteThemeVariant,
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
    SuiteAppIconVariant,
} from './messages';

// Event messages from renderer to main process
// Sent by DesktopApi.[method] via ipcRenderer.send (see ./main)
// Handled by ipcMain.on (see packages/suite-desktop/src/modules/*)
export interface MainChannels {
    'app/restart': void;
    'app/focus': void;
    'store/clear': void;
    'theme/change': SuiteThemeVariant;
    'app-icon/change': SuiteAppIconVariant;
    'tor/get-status': void;
    'update/allow-prerelease': boolean;
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
    // invity
    'spend/message': Partial<MessageEvent>;

    // tor
    'tor/status': TorStatusEvent;
    'tor/bootstrap': BootstrapTorEvent;

    // custom protocol
    'protocol/open': string;

    // bridge
    'bridge/status': Status;

    'handshake/event': HandshakeEvent;
}

// Invocation from renderer process
// Sent by DesktopApi.[method] via ipcRenderer.invoke (./main)
// Handled by ipcMain.handle (see packages/suite-desktop/src/modules/*)
export interface InvokeChannels {
    'handshake/client': () => void;
    'handshake/load-modules': (payload: HandshakeClient) => InvokeResult<HandshakeElectron>;
    'handshake/load-tor-module': () => HandshakeTorModule;
    'metadata/read': (options: { file: string }) => InvokeResult<string>;
    'metadata/write': (options: { file: string; content: string }) => InvokeResult;
    'metadata/get-files': () => InvokeResult<string[]>;
    'metadata/rename-file': (options: { file: string; to: string }) => InvokeResult;
    'server/request-address': (route: string) => string | undefined;
    'tor/toggle': (shouldEnableTor: boolean) => InvokeResult;
    'bridge/toggle': () => InvokeResult;
    'bridge/get-status': () => InvokeResult<Status>;
    'user-data/clear': () => InvokeResult;
    'user-data/open': (directory?: string) => InvokeResult;
    'udev/install': () => InvokeResult;
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
    // Auto-updater
    checkForUpdates: DesktopApiSend<'update/check'>;
    downloadUpdate: DesktopApiSend<'update/download'>;
    installUpdate: DesktopApiSend<'update/install'>;
    cancelUpdate: DesktopApiSend<'update/cancel'>;
    allowPrerelease: DesktopApiSend<'update/allow-prerelease'>;
    // Theme
    themeChange: DesktopApiSend<'theme/change'>;
    appIconChange: DesktopApiSend<'app-icon/change'>;
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
}
