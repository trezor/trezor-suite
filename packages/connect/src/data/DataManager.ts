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
            const json = await httpRequest(`${asset.url}${ts}`, 'json');
            this.assets[asset.name] = json;
        });
        await Promise.all(assetPromises);

        this.messages = await httpRequest(`${config.messages}${ts}`, 'json');

        // parse bridge JSON
        parseBridgeJSON(this.assets.bridge);

        // parse coins definitions
        parseCoinsJson({
            ...this.assets.coins,
            eth: this.assets.coinsEth,
        });

        // parse firmware definitions
        parseFirmware(this.assets['firmware-t1b1'], DeviceModelInternal.T1B1);
        parseFirmware(this.assets['firmware-t2t1'], DeviceModelInternal.T2T1);
        parseFirmware(this.assets['firmware-t2b1'], DeviceModelInternal.T2B1);
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
