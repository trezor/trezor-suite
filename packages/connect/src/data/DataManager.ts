// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import { parseCoinsJson } from './coinInfo';
import { parseFirmware } from './firmwareInfo';
import { parseBridgeJSON } from './transportInfo';
import { ConnectSettings, DeviceModelInternal } from '../types';

// We need to declare those imports explicitly so webpack does not include the whole directories.
require('@trezor/connect-common/files/coins.json');
require('@trezor/connect-common/files/coins-eth.json');
require('@trezor/connect-common/files/bridge/releases.json');
require('@trezor/connect-common/files/firmware/t1b1/releases.json');
require('@trezor/connect-common/files/firmware/t2t1/releases.json');
require('@trezor/connect-common/files/firmware/t2b1/releases.json');
require('@trezor/connect-common/files/firmware/t3b1/releases.json');
require('@trezor/connect-common/files/firmware/t3t1/releases.json');
require('@trezor/connect-common/files/firmware/t3w1/releases.json');
require('@trezor/protobuf/messages.json');

import coins from '@trezor/connect-common/files/coins.json';
import coinsEth from '@trezor/connect-common/files/coins-eth.json';
import bridge from '@trezor/connect-common/files/bridge/releases.json';
import t1b1 from '@trezor/connect-common/files/firmware/t1b1/releases.json';
import t2t2 from '@trezor/connect-common/files/firmware/t2t1/releases.json';
import t2b1 from '@trezor/connect-common/files/firmware/t2b1/releases.json';
import t3b1 from '@trezor/connect-common/files/firmware/t3b1/releases.json';
import t3t1 from '@trezor/connect-common/files/firmware/t3t1/releases.json';
import t3w1 from '@trezor/connect-common/files/firmware/t3w1/releases.json';

type AssetCollection = { [key: string]: Record<string, any> };

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any>;

    static async load(settings: ConnectSettings, withAssets = true) {
        this.settings = settings;

        if (!withAssets) return;

        this.assets['coins'] = coins;
        this.assets['coinsEth'] = coinsEth;
        this.assets['bridge'] = bridge;
        this.assets['firmware-t1b1'] = t1b1;
        this.assets['firmware-t2t1'] = t2t2;
        this.assets['firmware-t2b1'] = t2b1;
        this.assets['firmware-t3b1'] = t3b1;
        this.assets['firmware-t3t1'] = t3t1;
        this.assets['firmware-t3w1'] = t3w1;

        this.messages = (await import('@trezor/protobuf/messages.json')).default;

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
