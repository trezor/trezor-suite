// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import { httpRequest } from '../utils/assets';
import { parseCoinsJson } from './coinInfo';
import { parseFirmware } from './firmwareInfo';
import { parseBridgeJSON } from './transportInfo';
import { config } from './config';

import { ConnectSettings, DeviceModelInternal } from '../types';

type AssetCollection = { [key: string]: Record<string, any> };

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any>;

    static async load(settings: ConnectSettings, withAssets = true) {
        const ts = settings.env === 'web' ? `?r=${settings.timestamp}` : '';
        this.settings = settings;

        if (!withAssets) return;

        const assetPromises = config.assets.map(async asset => {
            const json = await httpRequest(`${settings.connectSrc}${asset.url}${ts}`, 'json');
            this.assets[asset.name] = json;
        });
        await Promise.all(assetPromises);

        this.messages = await httpRequest(`${settings.connectSrc}${config.messages}${ts}`, 'json');

        // parse bridge JSON
        parseBridgeJSON(this.assets.bridge);

        // parse coins definitions
        parseCoinsJson({
            ...this.assets.coins,
            ...this.assets.coinsEth,
        });

        // parse firmware definitions
        for (const model in DeviceModelInternal) {
            const firmwareKey = `firmware-${model.toLowerCase()}`;
            const modelType = DeviceModelInternal[model as keyof typeof DeviceModelInternal];
            // Check if the firmware data exists for this model
            if (this.assets[firmwareKey]) {
                parseFirmware(this.assets[firmwareKey], modelType);
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

    static getConfig() {
        return config;
    }
}
