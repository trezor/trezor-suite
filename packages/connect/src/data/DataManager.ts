// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import coinsEth from '@trezor/connect-common/files/coins-eth.json';
import coins from '@trezor/connect-common/files/coins.json';
import { DeviceModelInternal, FirmwareRelease } from '@trezor/device-utils';
import messages from '@trezor/protobuf/messages.json';

import { parseCoinsJson } from './coinInfo';
import { parseFirmwareReleases } from './firmwareInfo';
import type { ConnectSettings, LocalFirmwares } from '../types/settings';
import { firmwareAssets } from '../utils/assetUtils'; // Adjust the path as necessary

type AssetKeys = `firmware-${string}` | 'coins' | 'coinsEth';
type AssetCollection = {
    [K in AssetKeys]?: Record<string, any>;
};

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any> = messages;
    private static localFirmwares: LocalFirmwares = { firmwareDir: '', firmwareList: [] };

    static load(settings: ConnectSettings, withAssets = true) {
        this.settings = settings;

        if (!withAssets) return;

        const assetsMap = {
            coins,
            coinsEth,
            ...Object.fromEntries(
                Object.entries(firmwareAssets).map(([key, value]) => {
                    // For `unknown` firmware we get `{}` so we use `[]` to have always same type.
                    const release = Array.isArray(value) ? value : [];

                    return [`firmware-${key.toLowerCase()}`, release];
                }),
            ),
        };
        Object.assign(this.assets, assetsMap);

        // parse coins definitions
        parseCoinsJson({
            ...this.assets.coins,
            ...this.assets.coinsEth,
        });

        // parse firmware definitions
        for (const model in DeviceModelInternal) {
            const firmwareKey: `firmware-${string}` = `firmware-${model.toLowerCase()}`;
            const modelType = DeviceModelInternal[model as keyof typeof DeviceModelInternal];
            const modelReleases = this.assets[firmwareKey] as FirmwareRelease[];
            // Check if the firmware data exists for this model
            if (modelReleases) {
                parseFirmwareReleases(modelReleases, modelType);
            }
        }
    }

    static getProtobufMessages() {
        return this.messages;
    }

    static getSettings(key?: undefined): ConnectSettings;
    static getSettings<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];
    static getSettings(key?: keyof ConnectSettings) {
        if (!this.settings) return null;
        if (typeof key === 'string') {
            return this.settings[key];
        }

        return this.settings;
    }

    static setLocalFirmwares(firmwares: LocalFirmwares): void {
        this.localFirmwares = firmwares;
    }
    static getLocalFirmwares(): LocalFirmwares {
        return this.localFirmwares;
    }
}
