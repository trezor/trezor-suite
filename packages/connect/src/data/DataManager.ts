// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import coinsEth from '@trezor/connect-common/files/coins-eth.json';
import coins from '@trezor/connect-common/files/coins.json';
import {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareType,
    IntermediaryReleaseConfig,
    ReleasesConfig,
} from '@trezor/device-utils';
import messages from '@trezor/protobuf/messages.json';

import { parseCoinsJson } from './coinInfo';
import { initializeFirmwareConfig } from './firmwareInfo';
import type { ConnectSettings, LocalFirmwares } from '../types/settings';
import {
    getFirmwareReleaseConfig,
    getOnlyLocalFirmwareReleaseConfig,
} from '../utils/firmwareReleaseConfigUtils';

type AssetKeys = `firmware-${string}` | 'coins' | 'coinsEth';
type AssetCollection = {
    [K in AssetKeys]?: Record<string, any>;
};

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    private static messages: Record<string, any> = messages;
    private static localFirmwares: LocalFirmwares = { firmwareDir: '', firmwareList: [] };
    private static firmwareReleasesConfig: Partial<
        Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>
    > = {};
    private static firmwareIntermediaryReleasesConfig:
        | Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]>
        | undefined;

    static async load(
        settings: ConnectSettings,
        withAssets = true,
        onlyLocalFirmwareConfig = false,
    ) {
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

        await this.loadFirmwareRelaseConfig(onlyLocalFirmwareConfig);
    }

    static async loadFirmwareRelaseConfig(onlyLocal: boolean): Promise<void> {
        let firmwareRelaseConfig;
        if (onlyLocal) {
            firmwareRelaseConfig = getOnlyLocalFirmwareReleaseConfig();
        } else {
            firmwareRelaseConfig = await getFirmwareReleaseConfig();
        }
        const { config, isRemote } = firmwareRelaseConfig;
        const firmwareconfig = await initializeFirmwareConfig(config, isRemote);
        this.setFirmwareReleaseConfig(firmwareconfig.releases);
        this.setFirmwareIntermediaryReleaseConfig(firmwareconfig.intermediaries);
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

    static setFirmwareReleaseConfig(releaseConfig: ReleasesConfig): void {
        this.firmwareReleasesConfig = releaseConfig;
    }
    static getFirmwareReleaseConfig() {
        return this.firmwareReleasesConfig;
    }
    static setFirmwareIntermediaryReleaseConfig(
        intermediariesConfig: Record<DeviceModelInternal, IntermediaryReleaseConfig[]>,
    ) {
        this.firmwareIntermediaryReleasesConfig = intermediariesConfig;
    }
    static getFirmwareIntermediaryReleaseConfig() {
        return this.firmwareIntermediaryReleasesConfig;
    }
}
