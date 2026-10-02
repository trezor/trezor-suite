interface Window {
    // Needed for Cypress and Playwright
    Playwright?: any;
    store?: any;
}

// Globals
declare namespace globalThis {
    // eslint-disable-next-line no-var
    var resourcesPath: string;
    // eslint-disable-next-line no-var
    var customProtocolUrl: string;
}

declare type BeforeRequestListener = (
    details: Electron.OnBeforeRequestListenerDetails,
) => Electron.CallbackResponse | undefined;

declare interface RequestInterceptor {
    onBeforeRequest(listener: BeforeRequestListener): void;

    offBeforeRequest(listener: BeforeRequestListener): void;
}

declare type WinBounds = {
    height: number;
    width: number;
};

declare type UpdateSettings = {
    // saving application version gives us ability to tell whether app got updated or not.
    /**
     * Duplicates and persists `app.getVersion()` most of the time except the first app start after an update.
     * In that case it's used to detect an update to display a success notification to the user.
     * Use `app.getVersion()` to get the current version of the app.
     */
    savedCurrentVersion?: string;
    allowPrerelease: boolean;
    isAutomaticUpdateEnabled: boolean;
};

declare type TorSettings = {
    running: boolean; // Tor should be enabled
    host: string; // Hostname of the tor process through which traffic is routed
    port: number; // Port of the Tor process through which traffic is routed
    controlPort: number; // Port of the Tor Control Port
    torDataDir: string; // Path of tor data directory
    useExternalTor: boolean; // Tor should use external daemon instead of the one built-in suite.
    externalPort: number; // Tor external port.
};

declare type BridgeSettings = {
    /**
     * Force suite not to start bridge on application startup
     */
    doNotStartOnStartup: boolean;
};

declare type TraySettings = {
    showOnTray: boolean;
};

declare type ElectronConnectSettings = {
    disableWs: boolean;
    autoStartDontAskAgain: boolean;
    hasUsedConnectWs: boolean;
};

declare type BioAuthSettings = {
    enabled?: boolean;
};

declare type McpSettings = {
    enabled: boolean;
    port: number;
    token?: string;
};
