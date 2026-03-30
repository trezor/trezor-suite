// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import type { ConnectSettings, LocalFirmwares } from '@trezor/connect-common';
import coinsEth from '@trezor/connect-data/files/coins-eth.json';
import coins from '@trezor/connect-data/files/coins.json';
import type {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareReleaseConfig,
    FirmwareType,
    IntermediaryReleaseConfig,
    ReleasesConfig,
} from '@trezor/device-utils';
import messages from '@trezor/protobuf/messages.json';

import { parseCoinsJson } from './coinInfo';
import {
    getFirmwareReleaseConfig,
    getOnlyLocalFirmwareReleaseConfig,
} from '../utils/firmwareReleaseConfigUtils';

export type InitializeFirmwareConfig = (
    config: FirmwareReleaseConfig,
    isRemote: boolean,
) => Promise<{
    releases: ReleasesConfig;
    intermediaries: Record<DeviceModelInternal, IntermediaryReleaseConfig[]>;
}>;

type AssetKeys = `firmware-${string}` | 'coins' | 'coinsEth';
type AssetCollection = {
    [K in AssetKeys]?: Record<string, any>;
};

export class DataManager {
    static assets: AssetCollection = {};

    private static settings: ConnectSettings;
    // at the moment, messages is readonly but it might make sense to modify this in the future, when
    // we implement additive protobufs handling as a part of modularization effort
    private static readonly messages: Record<string, any> = messages;
    private static localFirmwares: LocalFirmwares = { firmwareDir: '', firmwareList: [] };
    private static firmwareReleasesConfig: Partial<
        Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>
    > = {};
    private static firmwareIntermediaryReleasesConfig:
        | Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]>
        | undefined;
    private static localFirmwareReleaseConfig: FirmwareReleaseConfig;
    private static initializeFirmwareConfig: InitializeFirmwareConfig;

    public static async load(
        settings: ConnectSettings,
        withAssets = true,
        onlyLocalFirmwareConfig = false,
        initializeFirmwareConfig?: InitializeFirmwareConfig,
    ) {
        if (initializeFirmwareConfig) {
            this.initializeFirmwareConfig = initializeFirmwareConfig;
        }
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

        this.prepareLocalFirmwareReleaseData();
        await this.loadFirmwareReleaseConfig(onlyLocalFirmwareConfig);
    }

    private static prepareLocalFirmwareReleaseData() {
        const { config } = getOnlyLocalFirmwareReleaseConfig();
        this.setLocalFirmwareReleaseConfig(config);
    }

    private static async loadFirmwareReleaseConfig(onlyLocal: boolean): Promise<void> {
        let firmwareReleaseConfig;
        if (onlyLocal) {
            firmwareReleaseConfig = {
                config: this.getLocalFirmwareReleaseConfig(),
                isRemote: false,
            };
        } else {
            firmwareReleaseConfig = await getFirmwareReleaseConfig(this.settings?.firmwareChannel);
        }
        const { config, isRemote } = firmwareReleaseConfig;
        const firmwareConfig = await this.initializeFirmwareConfig(config, isRemote);
        this.setFirmwareReleaseConfig(firmwareConfig.releases);
        this.setFirmwareIntermediaryReleaseConfig(firmwareConfig.intermediaries);
    }

    public static getProtobufMessages() {
        return this.messages;
    }

    public static updateSettings(update: Partial<ConnectSettings>) {
        this.settings = {
            ...this.settings,
            ...update,
        };
    }

    public static getSettings(key?: undefined): ConnectSettings;
    public static getSettings<T extends keyof ConnectSettings>(key: T): ConnectSettings[T];
    public static getSettings(key?: keyof ConnectSettings) {
        if (!this.settings) return null;
        if (typeof key === 'string') {
            return this.settings[key];
        }

        return this.settings;
    }

    public static setLocalFirmwares(firmwares: LocalFirmwares): void {
        this.localFirmwares = firmwares;
    }
    public static getLocalFirmwares(): LocalFirmwares {
        return this.localFirmwares;
    }

    private static setLocalFirmwareReleaseConfig(
        localFirmwareReleaseConfig: FirmwareReleaseConfig,
    ) {
        this.localFirmwareReleaseConfig = localFirmwareReleaseConfig;
    }
    public static getLocalFirmwareReleaseConfig(): FirmwareReleaseConfig {
        return this.localFirmwareReleaseConfig;
    }

    private static setFirmwareReleaseConfig(releaseConfig: ReleasesConfig): void {
        this.firmwareReleasesConfig = releaseConfig;
    }
    public static getFirmwareReleaseConfig() {
        return this.firmwareReleasesConfig;
    }
    private static setFirmwareIntermediaryReleaseConfig(
        intermediariesConfig: Record<DeviceModelInternal, IntermediaryReleaseConfig[]>,
    ) {
        this.firmwareIntermediaryReleasesConfig = intermediariesConfig;
    }
    public static getFirmwareIntermediaryReleaseConfig() {
        return this.firmwareIntermediaryReleasesConfig;
    }
}
