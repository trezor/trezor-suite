import ElectronStore from 'electron-store';

import { type SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { getInitialWindowSize } from './screen';

type OnDidChangeCallback<T> = (newValue?: T, oldValue?: T) => void;
type Unsubscribe = () => void;

export type WinBoundsCoords = WinBounds & {
    x?: number;
    y?: number;
};

export class Store {
    private static instance: Store;
    private readonly store: ElectronStore<{
        winBounds: WinBoundsCoords;
        updateSettings: UpdateSettings;
        themeSettings: SuiteThemeVariant;
        torSettings: TorSettings;
        bridgeSettings: BridgeSettings;
        traySettings: TraySettings;
        connectSettings: ConnectSettings;
        bioAuthSettings: BioAuthSettings;
        mcpSettings: McpSettings;
    }>;

    private constructor() {
        this.store = new ElectronStore();
    }

    public static getStore(): Store {
        if (!Store.instance) {
            Store.instance = new Store();
        }

        return Store.instance;
    }

    public getWinBounds() {
        return this.store.get('winBounds', getInitialWindowSize());
    }

    public setWinBounds(winBounds: WinBoundsCoords) {
        // save only non zero dimensions
        if (winBounds.width > 0 && winBounds.height > 0) {
            this.store.set('winBounds', winBounds);
        }
    }

    public getUpdateSettings() {
        return this.store.get('updateSettings', {
            allowPrerelease: false,
            isAutomaticUpdateEnabled: false,
        });
    }

    public setUpdateSettings(updateSettings: UpdateSettings) {
        this.store.set('updateSettings', updateSettings);
    }

    public getThemeSettings() {
        return this.store.get('themeSettings', 'system');
    }

    public setThemeSettings(themeSettings: SuiteThemeVariant) {
        this.store.set('themeSettings', themeSettings);
    }

    public getTorSettings() {
        return this.store.get('torSettings', {
            running: false,
            port: 9050,
            controlPort: 9051,
            host: '127.0.0.1',
            useExternalTor: false,
            externalPort: 9050,
            torDataDir: '',
        });
    }

    public setTorSettings(torSettings: TorSettings) {
        this.store.set('torSettings', torSettings);
    }

    public onTorSettingsChange(callback: OnDidChangeCallback<TorSettings>): Unsubscribe {
        return this.store.onDidChange('torSettings', callback);
    }

    public getBridgeSettings() {
        return this.store.get('bridgeSettings', {
            doNotStartOnStartup: false,
            legacy: false,
        });
    }

    public setBridgeSettings(bridgeSettings: BridgeSettings) {
        this.store.set('bridgeSettings', bridgeSettings);
    }

    public getTraySettings() {
        return this.store.get('traySettings', {
            showOnTray: false,
        });
    }

    public setTraySettings(traySettings: TraySettings) {
        this.store.set('traySettings', traySettings);
    }

    public getConnectSettings() {
        return this.store.get('connectSettings', {
            disableWs: false,
            autoStartDontAskAgain: false,
            hasUsedConnectWs: false,
        });
    }

    public setConnectSettings(connectSettings: Partial<ConnectSettings>) {
        this.store.set('connectSettings', {
            ...this.store.get('connectSettings'),
            ...connectSettings,
        });
    }

    public getBioAuthSettings() {
        // back-compatibility: previously stored in redux, now in electron store. this is the reason why we don't setup default explicitly but keep it undefined,
        // after the first start of the application, this value should be set to the old stored value.
        return this.store.get('bioAuthSettings', { enabled: undefined });
    }

    public setBioAuthSettings(bioAuthSettings: Partial<BioAuthSettings>) {
        this.store.set('bioAuthSettings', {
            ...this.store.get('bioAuthSettings'),
            ...bioAuthSettings,
        });
    }

    public onBioAuthSettingsChange(callback: OnDidChangeCallback<BioAuthSettings>): Unsubscribe {
        return this.store.onDidChange('bioAuthSettings', callback);
    }

    public getMcpSettings() {
        return this.store.get('mcpSettings', {
            enabled: false,
            port: 21340,
        });
    }

    public setMcpSettings(mcpSettings: Partial<McpSettings>) {
        this.store.set('mcpSettings', {
            ...this.getMcpSettings(),
            ...mcpSettings,
        });
    }

    /** Deletes all items from the store. */
    public clear() {
        this.store.clear();
    }
}
