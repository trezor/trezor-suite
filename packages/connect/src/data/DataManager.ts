// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import coinsEth from '@trezor/connect-common/files/coins-eth.json';
import coins from '@trezor/connect-common/files/coins.json';
import messages from '@trezor/protobuf/messages.json';

import { parseCoinsJson } from './coinInfo';
import { parseFirmwareReleaseConfig } from './firmwareInfo';
import type { ConnectSettings, LocalFirmwares } from '../types/settings';
import { getFirmwareReleaseConfig } from '../utils/firmwareReleaseConfigUtils';

type AssetKeys = `firmware-${string}` | 'coins' | 'coinsEth';
type AssetCollection = {
    [K in AssetKeys]?: Record<string, any>;
};

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any> = messages;
    private static localFirmwares: LocalFirmwares = { firmwareDir: '', firmwareList: [] };

    static async load(settings: ConnectSettings, withAssets = true) {
        this.settings = settings;

        if (!withAssets) return;

        const assetsMap = {
            coins,
            coinsEth,
        };
        Object.assign(this.assets, assetsMap);

        // parse coins definitions
        parseCoinsJson({
            ...this.assets.coins,
            ...this.assets.coinsEth,
        });

        const { config, isRemote } = await getFirmwareReleaseConfig();
        await parseFirmwareReleaseConfig(config, isRemote);
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
