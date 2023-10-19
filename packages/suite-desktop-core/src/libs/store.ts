import ElectronStore from 'electron-store';

import { SuiteThemeVariant } from '@trezor/suite-desktop-api';

import { getInitialWindowSize } from './screen';

type OnDidChangeCallback<T> = (newValue?: T, oldValue?: T) => void;

export class Store {
    private static instance: Store;
    private readonly store: ElectronStore<{
        winBounds: WinBounds;
        updateSettings: UpdateSettings;
        themeSettings: SuiteThemeVariant;
        torSettings: TorSettings;
        bridgeSettings: BridgeSettings;
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

    public setWinBounds(winBounds: WinBounds) {
        // save only non zero dimensions
        if (winBounds.width > 0 && winBounds.height > 0) {
            this.store.set('winBounds', winBounds);
        }
    }

    public getUpdateSettings() {
        return this.store.get('updateSettings', { allowPrerelease: false });
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
        return this.store.get('torSettings', { running: false });
    }

    public setTorSettings(torSettings: TorSettings) {
        this.store.set('torSettings', torSettings);
    }

    public onTorSettingsChange(callback: OnDidChangeCallback<TorSettings>) {
        return this.store.onDidChange('torSettings', callback);
    }

    public getBridgeSettings() {
        return this.store.get('bridgeSettings', {
            startOnStartup: true,
        });
    }

    public setBridgeSettings(bridgeSettings: BridgeSettings) {
        this.store.set('bridgeSettings', bridgeSettings);
    }

    /** Deletes all items from the store. */
    public clear() {
        this.store.clear();
    }
}
