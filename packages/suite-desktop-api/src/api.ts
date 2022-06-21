import { ListenerMethod, SendMethod, InvokeMethod } from './methods';
import { SuiteThemeVariant, UpdateInfo, UpdateProgress, InvokeResult } from './messages';

// Event messages from renderer to main process
// Sent by DesktopApi.[method] via ipcRenderer.send (see ./main)
// Handled by ipcMain.on (see packages/suite-desktop/src-electron/modules/*)
export interface MainChannels {
    'app/restart': void;
    'app/focus': void;
    'client/ready': void;
    'store/clear': void;
    'theme/change': SuiteThemeVariant;
    'tor/get-status': void;
    'update/allow-prerelease': boolean;
    'update/cancel': void;
    'update/check': boolean | undefined;
    'update/download': void;
    'update/install': void;
}

// Event messages from main to renderer process
// Sent by mainWindow.webContents.send (see packages/suite-desktop/src-electron/modules/*)
// Handled by DesktopApi.on/once (see ./main)
export interface RendererChannels {
    // oauth
    'oauth/response': { [key: string]: string };

    // Update events
    'update/enable': void;
    'update/checking': void;
    'update/available': UpdateInfo;
    'update/not-available': UpdateInfo;
    'update/error': Error;
    'update/downloading': UpdateProgress;
    'update/downloaded': UpdateInfo;
    'update/new-version-first-run': string;
    'update/allow-prerelease': boolean;
    // invity
    'spend/message': Partial<MessageEvent>;

    // tor
    'tor/status': boolean;

    // custom protocol
    'protocol/open': string;
}

// Invocation from renderer process
// Sent by DesktopApi.[method] via ipcRenderer.invoke (./main)
// Handled by ipcMain.handle (see packages/suite-desktop/src-electron/modules/*)
export interface InvokeChannels {
    'metadata/read': (options: { file: string }) => InvokeResult<string>;
    'metadata/write': (options: { file: string; content: string }) => InvokeResult;
    'server/request-address': (route: string) => string | undefined;
    'tor/get-address': () => string;
    'tor/toggle': (shouldEnableTor: boolean) => InvokeResult;
    'user-data/clear': () => InvokeResult;
    'user-data/get-info': () => InvokeResult<{ dir: string }>;
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
    // Client controls
    clientReady: DesktopApiSend<'client/ready'>;
    // Metadata
    metadataWrite: DesktopApiInvoke<'metadata/write'>;
    metadataRead: DesktopApiInvoke<'metadata/read'>;
    // HttpReceiver
    getHttpReceiverAddress: DesktopApiInvoke<'server/request-address'>;
    // Tor
    getTorStatus: DesktopApiSend<'tor/get-status'>;
    toggleTor: DesktopApiInvoke<'tor/toggle'>;
    // Store
    clearStore: DesktopApiSend<'store/clear'>;
    clearUserData: DesktopApiInvoke<'user-data/clear'>;
    getUserDataInfo: DesktopApiInvoke<'user-data/get-info'>;
    // Udev rules
    installUdevRules: DesktopApiInvoke<'udev/install'>;
}
