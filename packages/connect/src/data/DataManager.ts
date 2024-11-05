// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import { httpRequest } from '../utils/assets';
import { parseCoinsJson } from './coinInfo';
import { parseFirmware } from './firmwareInfo';
import { parseBridgeJSON } from './transportInfo';

import { ConnectSettings, DeviceModelInternal } from '../types';

type AssetCollection = { [key: string]: Record<string, any> };

const assets = [
    {
        name: 'coins',
        url: './data/coins.json',
    },
    {
        name: 'coinsEth',
        url: './data/coins-eth.json',
    },
    {
        name: 'bridge',
        url: './data/bridge/releases.json',
    },
    {
        name: 'firmware-t1b1',
        url: './data/firmware/t1b1/releases.json',
    },
    {
        name: 'firmware-t2t1',
        url: './data/firmware/t2t1/releases.json',
    },
    {
        name: 'firmware-t2b1',
        url: './data/firmware/t2b1/releases.json',
    },
    {
        name: 'firmware-t3b1',
        url: './data/firmware/t3b1/releases.json',
    },
    {
        name: 'firmware-t3t1',
        url: './data/firmware/t3t1/releases.json',
    },
    {
        name: 'firmware-t3tw1',
        url: './data/firmware/t3w1/releases.json',
    },
];

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any>;

    static async load(settings: ConnectSettings, withAssets = true) {
        const ts = settings.env === 'web' ? `?r=${settings.timestamp}` : '';
        this.settings = settings;

        if (!withAssets) return;

        const assetPromises = assets.map(async asset => {
            const json = await httpRequest(`${asset.url}${ts}`, 'json');
            this.assets[asset.name] = json;
        });
        await Promise.all(assetPromises);

        this.messages = await httpRequest('./data/messages/messages.json', 'json');

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
}
