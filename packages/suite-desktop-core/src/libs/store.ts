import ElectronStore from 'electron-store';

import { isLinux } from '@trezor/env-utils';
import { type SuiteThemeVariant } from '@trezor/suite-desktop-api';

import {
    decryptStoredPrimitiveValue,
    encryptStoredPrimitiveValue,
    wrapOnDidChangeWithDecryptedValues,
} from './safeStorage';
import { getInitialWindowSize } from './screen';

type OnDidChangeCallback<T> = (newValue?: T, oldValue?: T) => void;
type Unsubscribe = () => void;

export type WinBoundsCoords = WinBounds & {
    x?: number;
    y?: number;
};

type StoreSchema = {
    winBounds: WinBoundsCoords;
    updateSettings: UpdateSettings;
    themeSettings: SuiteThemeVariant;
    torSettings: TorSettings;
    bridgeSettings: BridgeSettings;
    traySettings: TraySettings;
    connectSettings: ElectronConnectSettings;
    bioAuthSettings: StoredBioAuthSettings;
    mcpSettings: StoredMcpSettings;
};

type LegacyStoredBioAuthSettings = {
    enabled?: boolean | SafeStorageEncryptedValue;
};

type LegacyStoredMcpSettings = {
    enabled: boolean;
    port: number;
    token?: string | SafeStorageEncryptedValue | SafeStoragePlaintextValue;
};

export class Store {
    private static instance: Store;
    private readonly store: ElectronStore<StoreSchema>;

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

    public setConnectSettings(connectSettings: Partial<ElectronConnectSettings>) {
        this.store.set('connectSettings', {
            ...this.store.get('connectSettings'),
            ...connectSettings,
        });
    }

    public getBioAuthSettings() {
        const storedBioAuthSettings = this.getStoredBioAuthSettings();

        // back-compatibility: previously stored in redux, now in electron store. this is the reason why we don't setup default explicitly but keep it undefined,
        // after the first start of the application, this value should be set to the old stored value.
        return {
            enabled: decryptStoredPrimitiveValue({
                rawValue: storedBioAuthSettings.enabled,
                defaultValue: !isLinux(),
            }),
        };
    }

    public setBioAuthSettings(bioAuthSettings: Partial<BioAuthSettings>) {
        const currentBioAuthSettings = this.getBioAuthSettings();
        const nextBioAuthSettings = { ...currentBioAuthSettings, ...bioAuthSettings };

        this.store.set('bioAuthSettings', {
            enabled: encryptStoredPrimitiveValue(nextBioAuthSettings.enabled),
        });
    }

    public onBioAuthSettingsChange(callback: OnDidChangeCallback<BioAuthSettings>): Unsubscribe {
        return this.store.onDidChange(
            'bioAuthSettings',
            wrapOnDidChangeWithDecryptedValues({
                decryptValue: storedBioAuthSettings => {
                    if (!storedBioAuthSettings) {
                        return undefined;
                    }

                    return {
                        enabled: decryptStoredPrimitiveValue({
                            rawValue: storedBioAuthSettings.enabled,
                            defaultValue: !isLinux(),
                        }),
                    };
                },
                callback,
            }),
        );
    }

    public getMcpSettings() {
        const storedMcpSettings = this.getStoredMcpSettings();

        return {
            ...storedMcpSettings,
            token: decryptStoredPrimitiveValue({
                rawValue: storedMcpSettings.token,
                defaultValue: undefined,
            }),
        };
    }

    public setMcpSettings(mcpSettings: Partial<McpSettings>) {
        const currentMcpSettings = this.getMcpSettings();
        const nextMcpSettings = { ...currentMcpSettings, ...mcpSettings };

        this.store.set('mcpSettings', {
            enabled: nextMcpSettings.enabled,
            port: nextMcpSettings.port,
            token: encryptStoredPrimitiveValue(nextMcpSettings.token),
        });
    }

    /** Deletes all items from the store. */
    public clear() {
        this.store.clear();
    }

    private getStoredBioAuthSettings() {
        return this.store.get('bioAuthSettings', {
            enabled: undefined,
        }) as LegacyStoredBioAuthSettings;
    }

    private getStoredMcpSettings() {
        return this.store.get('mcpSettings', {
            enabled: false,
            port: 21340,
        }) as LegacyStoredMcpSettings;
    }
}
