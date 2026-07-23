/**
 * Installs a `window.desktopApi` in the page BEFORE any Suite bundle runs, mirroring the Tauri
 * Rust backend (`packages/suite-desktop-tauri/src-tauri`). It is passed to
 * `context.addInitScript(...)` for the Tauri e2e target, which drives the desktop-mode frontend in
 * Chromium (WKWebView cannot be driven by WebDriver on macOS). The method→channel mapping and the
 * response shapes must stay in sync with:
 *   - packages/suite-desktop-tauri/src-tauri/preload/tauri-preload.js  (method surface)
 *   - packages/suite-desktop-tauri/src-tauri/src/lib.rs                (desktop_invoke responses)
 *
 * Must be a self-contained function (serialised by Playwright): no external references.
 */
export function installTauriDesktopApi() {
    // In-memory stand-in for the on-disk `<userDir>/metadata` files (the Electron main process writes
    // real files; the native Tauri backend does too — see src/lib.rs). Persists for the page session.
    const metadataStore: Record<string, string> = {};

    const INVOKE_RESPONSES: Record<string, (args: any[]) => any> = {
        'metadata/write': ([opts]: any[]) => {
            if (opts && typeof opts.file === 'string') {
                metadataStore[opts.file] = String(opts.content ?? '');

                return { success: true };
            }

            return { success: false, error: 'invalid params' };
        },
        'metadata/read': ([opts]: any[]) => {
            if (opts && typeof opts.file === 'string' && opts.file in metadataStore) {
                return { success: true, payload: metadataStore[opts.file] };
            }

            // missing file: Electron's read() returns a failure (ENOENT), which the metadata
            // provider treats as "no metadata yet" — returning success+undefined instead makes the
            // labeling code try to decrypt `undefined` and throw.
            return { success: false, error: 'ENOENT: no such file', code: 'ENOENT' };
        },
        'metadata/rename-file': ([opts]: any[]) => {
            if (opts && typeof opts.file === 'string' && typeof opts.to === 'string') {
                const existing = metadataStore[opts.file];
                if (existing !== undefined) {
                    metadataStore[opts.to] = existing;
                    delete metadataStore[opts.file];
                }

                return { success: true };
            }

            return { success: false, error: 'invalid params' };
        },
        'app/auto-start/is-enabled': () => ({ success: true, payload: false }),
        'app/is-visible': () => true,
        'app/is-fullscreen': () => false,
        'handshake/client': () => ({ statePatch: {} }),
        'handshake/load-modules': () => ({
            success: true,
            payload: {
                paths: {
                    userDir: '/tmp/trezor-suite-tauri',
                    binDir: `${window.location.origin}/static/bin`,
                },
                urls: { httpReceiver: 'http://127.0.0.1:21335' },
                // presence of desktopUpdate enables the auto-updater / EAP UI (desktopUpdate.enabled)
                desktopUpdate: { allowPrerelease: false, isAutomaticUpdateEnabled: true },
            },
        }),
        'handshake/load-tor-module': () => ({ shouldRunTor: false }),
        // wrapped in {success,payload} to match the Rust backend (tor.rs get_settings)
        'tor/get-settings': () => ({
            success: true,
            payload: {
                running: false,
                useExternalTor: false,
                externalPort: 9050,
                snowflakeBinaryPath: '',
                torDataDir: '',
            },
        }),
        'tor/toggle': () => ({ success: true, payload: false }),
        'bridge/get-status': () => ({ success: true, payload: { service: false, process: false } }),
        'bridge/get-settings': () => ({ success: true, payload: { doNotStartOnStartup: false } }),
        'tray/get-settings': () => ({ showOnTray: false }),
        'connect-popup/enabled': () => true,
        'connect-popup/ready': () => true,
        // Forward the Suite's connect-popup response out to the Node connect-ws bridge (which
        // relays it back to the dApp over ws://127.0.0.1:21335/connect-ws).
        'connect-popup/response': ([response]: any[]) => {
            const fn = (window as any).__tauriConnectPopupResponseToNode;
            if (typeof fn === 'function') fn(response);

            return undefined;
        },
        'bio-auth/is-bio-auth-available': () => false,
        'bio-auth/get-bio-auth-settings': () => ({ bioAuthEnabled: false }),
        'bio-auth/get-validation-status': () => null,
        'mcp/get-settings': () => ({ enabled: false }),
        'metadata/get-files': () => ({ success: true, payload: Object.keys(metadataStore) }),
        'user-data/clear': () => ({ success: true }),
        // mirrors src-tauri http_receiver::request_address — gate on the known route list and
        // return base+pathname (consumers append `?p=…`), else null
        'server/request-address': ([pathname]: any[]) => {
            const routes = [
                '/oauth',
                '/buy-redirect',
                '/buy-post',
                '/sell-redirect',
                '/exchange-redirect',
            ];

            return typeof pathname === 'string' && routes.includes(pathname)
                ? `http://127.0.0.1:21335${pathname}`
                : null;
        },
    };

    const INVOKE: Record<string, string> = {
        getAppAutoStartIsEnabled: 'app/auto-start/is-enabled',
        appAutoStartPopupAck: 'app/auto-start/popup-ack',
        appAutoStartPopupResponse: 'app/auto-start/popup-response',
        appIsVisible: 'app/is-visible',
        appIsFullScreen: 'app/is-fullscreen',
        handshake: 'handshake/client',
        loadModules: 'handshake/load-modules',
        loadTorModule: 'handshake/load-tor-module',
        metadataRead: 'metadata/read',
        metadataWrite: 'metadata/write',
        metadataGetFiles: 'metadata/get-files',
        metadataRenameFile: 'metadata/rename-file',
        getHttpReceiverAddress: 'server/request-address',
        toggleTor: 'tor/toggle',
        getTorSettings: 'tor/get-settings',
        changeTorSettings: 'tor/change-settings',
        clearUserData: 'user-data/clear',
        openUserDataDirectory: 'user-data/open',
        getBridgeStatus: 'bridge/get-status',
        toggleBridge: 'bridge/toggle',
        changeBridgeSettings: 'bridge/change-settings',
        getBridgeSettings: 'bridge/get-settings',
        changeTraySettings: 'tray/change-settings',
        getTraySettings: 'tray/get-settings',
        connectPopupEnabled: 'connect-popup/enabled',
        connectPopupSetEnabled: 'connect-popup/set-enabled',
        connectPopupReady: 'connect-popup/ready',
        connectPopupResponse: 'connect-popup/response',
        openSystemSettings: 'system/open-settings',
        setBioAuthSettings: 'bio-auth/set-bio-auth-settings',
        getBioAuthSettings: 'bio-auth/get-bio-auth-settings',
        validateBioAuth: 'bio-auth/validate-bio-auth',
        isBioAuthAvailable: 'bio-auth/is-bio-auth-available',
        getBioAuthStatus: 'bio-auth/get-validation-status',
        safeStoreEncrypt: 'safe-storage/encrypt',
        safeStoreDecrypt: 'safe-storage/decrypt',
        mcpGetSettings: 'mcp/get-settings',
        mcpSetEnabled: 'mcp/set-enabled',
        mcpRegenerateToken: 'mcp/regenerate-token',
        reloadBrowserWindow: 'browser-window/reload',
    };
    const SEND: Record<string, string> = {
        appRestart: 'app/restart',
        appFocus: 'app/focus',
        appHide: 'app/hide',
        appAutoStart: 'app/auto-start',
        checkForUpdates: 'update/check',
        downloadUpdate: 'update/download',
        installUpdate: 'update/install',
        cancelUpdate: 'update/cancel',
        allowPrerelease: 'update/allow-prerelease',
        setAutomaticUpdateEnabled: 'update/set-automatic-update-enabled',
        setAutoInstallOnAppQuit: 'update/set-auto-install-on-app-quit',
        themeChange: 'theme/change',
        getTorStatus: 'tor/get-status',
        clearStore: 'store/clear',
        configLogger: 'logger/config',
    };

    const listeners: Record<string, Array<(...a: any[]) => void>> = {};

    const emit = (channel: string, ...payload: any[]) => {
        (listeners[channel] || []).slice().forEach(fn => fn(...payload));
    };

    const invoke = (channel: string, args: any[]) => {
        const handler = INVOKE_RESPONSES[channel];

        return Promise.resolve(handler ? handler(args) : null);
    };

    // Some fire-and-forget calls are echoed back as events by the Electron main process (the
    // frontend waits for the event to update Redux). Emulate that round-trip.
    const SEND_ECHO_EVENT: Record<string, string> = {
        allowPrerelease: 'update/allow-prerelease',
        setAutomaticUpdateEnabled: 'update/set-automatic-update-enabled',
    };

    const desktopApi: Record<string, any> = {
        available: true,
        on: (channel: string, listener: (...a: any[]) => void) => {
            (listeners[channel] = listeners[channel] || []).push(listener);
        },
        once: (channel: string, listener: (...a: any[]) => void) => {
            (listeners[channel] = listeners[channel] || []).push(listener);
        },
        removeAllListeners: (channel: string) => {
            listeners[channel] = [];
        },
    };

    Object.entries(INVOKE).forEach(([method, channel]) => {
        desktopApi[method] = (...args: any[]) => invoke(channel, args);
    });
    Object.keys(SEND).forEach(method => {
        const echoChannel = SEND_ECHO_EVENT[method];
        desktopApi[method] = (...args: any[]) => {
            // Count window-focus requests so tests can assert Suite (does not) come to foreground —
            // the Tauri equivalent of spying on ipcMain 'app/focus' in the Electron main process.
            if (method === 'appFocus') {
                (window as any).__appFocusCalls = ((window as any).__appFocusCalls ?? 0) + 1;
            }
            if (echoChannel) emit(echoChannel, args[0]);
        };
    });

    (window as any).desktopApi = desktopApi;

    // window.ipcProxy stub for the Bluetooth transport. The real Tauri preload backs this with a
    // WebSocket to the bluetooth-host sidecar; in the Chromium e2e harness there is no BLE, so this
    // stub makes createIpcProxy('Bluetooth') resolve and BluetoothIpc.init succeed with no devices
    // (initBluetoothThunk then just registers listeners — no adapter, no error toast).
    (window as any).ipcProxy = {
        create: () => Promise.resolve(),
        request: (_channel: string, _instanceId: string, method: string) => {
            if (method === 'init') return Promise.resolve({ success: true });
            if (method === 'getInfo')
                return Promise.resolve({ success: false, error: 'no-adapter' });
            if (method === 'enumerateDevices') return Promise.resolve([]);

            return Promise.resolve({ success: true });
        },
        setHandler: () => {},
        clearHandler: () => {},
    };

    (window as any).desktopFlags = { exposeStore: true };
    (window as any).electronFind = { onShow: () => {}, offShow: () => {} };
    (window as any).cspNonce = (window as any).cspNonce || '';
    // Lets the Node connect-ws bridge deliver main-process events (e.g. 'connect-popup/call')
    // into the page as if they came from the Tauri backend.
    (window as any).__tauriEmitDesktopEvent = (channel: string, ...payload: any[]) =>
        emit(channel, ...payload);
}
