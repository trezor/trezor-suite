// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import coins from '@trezor/connect-common/files/coins.json';
import coinsEth from '@trezor/connect-common/files/coins-eth.json';
import bridge from '@trezor/connect-common/files/bridge/releases.json';
import messages from '@trezor/protobuf/messages.json';

import { parseCoinsJson } from './coinInfo';
import { parseFirmware } from './firmwareInfo';
import { parseBridgeJSON } from './transportInfo';
import { ConnectSettings, DeviceModelInternal } from '../types';
import { firmwareAssets } from '../utils/assetUtils'; // Adjust the path as necessary

type AssetCollection = { [key: string]: Record<string, any> };

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any> = messages;

    static load(settings: ConnectSettings, withAssets = true) {
        this.settings = settings;

        if (!withAssets) return;

        const assetsMap = {
            coins,
            coinsEth,
            bridge,
            ...Object.fromEntries(
                Object.entries(firmwareAssets).map(([key, value]) => [
                    `firmware-${key.toLowerCase()}`,
                    value,
                ]),
            ),
        };
        Object.assign(this.assets, assetsMap);

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
