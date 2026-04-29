// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import type { ConnectSettings } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import * as firmwareReleaseStore from './firmwareReleaseStore';
import type { InitializeFirmwareConfig } from './firmwareReleaseStore';

export class DataManager {
    private static settings: ConnectSettings;

    public static async load(
        settings: ConnectSettings,
        withAssets = true,
        onlyLocalFirmwareConfig = false,
        initializeFirmwareConfig?: InitializeFirmwareConfig,
    ) {
        this.settings = settings;

        if (!withAssets) return;

        if (!initializeFirmwareConfig) return;

        await firmwareReleaseStore.init(
            settings.firmwareChannel,
            onlyLocalFirmwareConfig,
            initializeFirmwareConfig,
        );
    }

    public static updateSettings(update: Partial<ConnectSettings>) {
        this.settings = {
            ...this.settings,
            ...update,
        };
    }

    public static isLoaded(): boolean {
        return this.settings != null;
    }

    public static getSettings(key?: undefined): ConnectSettings;
    public static getSettings<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];
    public static getSettings(key?: keyof ConnectSettings) {
        if (!this.settings) {
            throw ERRORS.TypedError('Runtime', 'DataManager.getSettings called before load()');
        }
        if (typeof key === 'string') {
            return this.settings[key];
        }

        return this.settings;
    }
}
