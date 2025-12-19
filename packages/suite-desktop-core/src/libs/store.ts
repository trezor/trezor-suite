import ElectronStore from 'electron-store';

import { SuiteThemeVariant } from '@trezor/suite-desktop-api';

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
        isAnonymousMode: boolean;
        winBounds: WinBoundsCoords;
        updateSettings: UpdateSettings;
        themeSettings: SuiteThemeVariant;
        torSettings: TorSettings;
        bridgeSettings: BridgeSettings;
        traySettings: TraySettings;
        connectSettings: ConnectSettings;
        bioAuthSettings: BioAuthSettings;
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

    /** Persists the anonymous mode setting. If true, persisting anything else will be disabled. */
    public setAnonymousMode(isAnonymousMode: boolean) {
        this.store.set('isAnonymousMode', isAnonymousMode);
    }

    public getAnonymousMode() {
        return this.store.get('isAnonymousMode', false);
    }

    private isEnabled() {
        return this.getAnonymousMode() === false;
    }

    public getWinBounds() {
        return this.store.get('winBounds', getInitialWindowSize());
    }

    public setWinBounds(winBounds: WinBoundsCoords) {
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
        this.store.set('updateSettings', updateSettings);
    }

    public getThemeSettings() {
        return this.store.get('themeSettings', 'system');
    }

    public setThemeSettings(themeSettings: SuiteThemeVariant) {
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
        this.store.set('bridgeSettings', bridgeSettings);
    }

    public getTraySettings() {
        return this.store.get('traySettings', {
            showOnTray: false,
        });
    }

    public setTraySettings(traySettings: TraySettings) {
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
        this.store.set('bioAuthSettings', {
            ...this.store.get('bioAuthSettings'),
            ...bioAuthSettings,
        });
    }

    public onBioAuthSettingsChange(callback: OnDidChangeCallback<BioAuthSettings>): Unsubscribe {
        return this.store.onDidChange('bioAuthSettings', callback);
    }

    /** Deletes all items from the store. */
    public clear() {
        this.store.clear();
    }
}
