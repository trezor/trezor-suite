import { type DesktopApi } from '@trezor/suite-desktop-api';

/**
 * The web build has no Electron main process, so there is nothing to talk to. Calls are reported
 * rather than silently ignored, which is what the desktop-only call sites guarded by
 * `desktopApi.available` expect to never reach.
 */
const unavailable =
    (method: string) =>
    (...args: unknown[]) => {
        console.error('desktopApi not available:', method, ...args);
    };

const unavailableAsync =
    (method: string) =>
    (...args: unknown[]): Promise<never> =>
        Promise.reject(new Error(`desktopApi not available: ${[method, ...args].join(',')}`));

/**
 * Every member is listed explicitly: adding a method to `DesktopApi` must fail to compile here
 * until the web behaviour for it is decided.
 */
export const createWebDesktopApi = (): DesktopApi => ({
    available: false,

    // Events
    on: unavailable('on'),
    once: unavailable('once'),
    removeAllListeners: unavailable('removeAllListeners'),

    // App
    appRestart: unavailable('appRestart'),
    appFocus: unavailable('appFocus'),
    appHide: unavailable('appHide'),
    appAutoStart: unavailable('appAutoStart'),
    // Auto-updater
    checkForUpdates: unavailable('checkForUpdates'),
    downloadUpdate: unavailable('downloadUpdate'),
    installUpdate: unavailable('installUpdate'),
    cancelUpdate: unavailable('cancelUpdate'),
    allowPrerelease: unavailable('allowPrerelease'),
    setAutomaticUpdateEnabled: unavailable('setAutomaticUpdateEnabled'),
    setAutoInstallOnAppQuit: unavailable('setAutoInstallOnAppQuit'),
    // Theme
    themeChange: unavailable('themeChange'),
    // Tor
    getTorStatus: unavailable('getTorStatus'),
    // Store
    clearStore: unavailable('clearStore'),
    // Logger
    configLogger: unavailable('configLogger'),

    // App
    getAppAutoStartIsEnabled: unavailableAsync('getAppAutoStartIsEnabled'),
    appAutoStartPopupAck: unavailableAsync('appAutoStartPopupAck'),
    appAutoStartPopupResponse: unavailableAsync('appAutoStartPopupResponse'),
    appIsVisible: unavailableAsync('appIsVisible'),
    appIsFullScreen: unavailableAsync('appIsFullScreen'),
    // Handshake
    handshake: unavailableAsync('handshake'),
    loadModules: unavailableAsync('loadModules'),
    loadTorModule: unavailableAsync('loadTorModule'),
    // Metadata
    metadataWrite: unavailableAsync('metadataWrite'),
    metadataRead: unavailableAsync('metadataRead'),
    metadataGetFiles: unavailableAsync('metadataGetFiles'),
    metadataRenameFile: unavailableAsync('metadataRenameFile'),
    // HttpReceiver
    getHttpReceiverAddress: unavailableAsync('getHttpReceiverAddress'),
    // Tor
    toggleTor: unavailableAsync('toggleTor'),
    changeTorSettings: unavailableAsync('changeTorSettings'),
    getTorSettings: unavailableAsync('getTorSettings'),
    // Store
    clearUserData: unavailableAsync('clearUserData'),
    openUserDataDirectory: unavailableAsync('openUserDataDirectory'),
    // Bridge
    getBridgeStatus: unavailableAsync('getBridgeStatus'),
    toggleBridge: unavailableAsync('toggleBridge'),
    changeBridgeSettings: unavailableAsync('changeBridgeSettings'),
    getBridgeSettings: unavailableAsync('getBridgeSettings'),
    // Tray
    changeTraySettings: unavailableAsync('changeTraySettings'),
    getTraySettings: unavailableAsync('getTraySettings'),
    // Connect popup
    connectPopupEnabled: unavailableAsync('connectPopupEnabled'),
    connectPopupSetEnabled: unavailableAsync('connectPopupSetEnabled'),
    connectPopupReady: unavailableAsync('connectPopupReady'),
    connectPopupResponse: unavailableAsync('connectPopupResponse'),
    // system
    openSystemSettings: unavailableAsync('openSystemSettings'),
    // bioAuth
    setBioAuthSettings: unavailableAsync('setBioAuthSettings'),
    getBioAuthSettings: unavailableAsync('getBioAuthSettings'),
    isBioAuthAvailable: unavailableAsync('isBioAuthAvailable'),
    validateBioAuth: unavailableAsync('validateBioAuth'),
    getBioAuthStatus: unavailableAsync('getBioAuthStatus'),
    // safeStorage
    safeStoreEncrypt: unavailableAsync('safeStoreEncrypt'),
    safeStoreDecrypt: unavailableAsync('safeStoreDecrypt'),
    // MCP server
    mcpGetSettings: unavailableAsync('mcpGetSettings'),
    mcpSetEnabled: unavailableAsync('mcpSetEnabled'),
    mcpRegenerateToken: unavailableAsync('mcpRegenerateToken'),
    // Browser Window
    reloadBrowserWindow: unavailableAsync('reloadBrowserWindow'),
});
