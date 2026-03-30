// origin: https://github.com/trezor/connect/blob/develop/src/js/data/DataManager.js

import type { ConnectSettings, LocalFirmwares } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
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

export class DataManager {
    private static settings: ConnectSettings;
    // at the moment, messages is readonly but it might make sense to modify this in the future, when
    // we implement additive protobufs handling as a part of modularization effort
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

        parseCoinsJson({
            ...coins,
            ...coinsEth,
        });

        const { config: localFirmwareReleaseConfig } = getOnlyLocalFirmwareReleaseConfig();
        this.localFirmwareReleaseConfig = localFirmwareReleaseConfig;
        await this.loadFirmwareReleaseConfig(onlyLocalFirmwareConfig);
    }

    private static async loadFirmwareReleaseConfig(onlyLocal: boolean): Promise<void> {
        let firmwareReleaseConfig;
        if (onlyLocal) {
            firmwareReleaseConfig = {
                config: this.localFirmwareReleaseConfig,
                isRemote: false,
            };
        } else {
            firmwareReleaseConfig = await getFirmwareReleaseConfig(this.settings?.firmwareChannel);
        }
        const { config, isRemote } = firmwareReleaseConfig;
        const firmwareConfig = await this.initializeFirmwareConfig(config, isRemote);
        this.firmwareReleasesConfig = firmwareConfig.releases;
        this.firmwareIntermediaryReleasesConfig = firmwareConfig.intermediaries;
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

    public static setLocalFirmwares(firmwares: LocalFirmwares): void {
        this.localFirmwares = firmwares;
    }
    public static getLocalFirmwares(): LocalFirmwares {
        return this.localFirmwares;
    }

    public static getLocalFirmwareReleaseConfig(): FirmwareReleaseConfig {
        return this.localFirmwareReleaseConfig;
    }

    public static getFirmwareReleaseConfig() {
        return this.firmwareReleasesConfig;
    }

    public static getFirmwareIntermediaryReleaseConfig() {
        return this.firmwareIntermediaryReleasesConfig;
    }
}
