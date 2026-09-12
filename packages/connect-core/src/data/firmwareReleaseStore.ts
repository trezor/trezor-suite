import type { FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import type {
    ConditionalRelease,
    DeviceModelInternal,
    FirmwareReleaseConfig,
    FirmwareType,
    IntermediaryReleaseConfig,
    ReleasesConfig,
} from '@trezor/device-utils';

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

const local: FirmwareReleaseConfig = getOnlyLocalFirmwareReleaseConfig().config;
let releases:
    | Partial<Record<keyof typeof DeviceModelInternal, Record<FirmwareType, ConditionalRelease>>>
    | undefined;
let intermediary: Record<keyof typeof DeviceModelInternal, IntermediaryReleaseConfig[]> | undefined;

export const init = async (
    firmwareChannel: FirmwareChannel | undefined,
    onlyLocal: boolean,
    initializeFirmwareConfig: InitializeFirmwareConfig,
): Promise<void> => {
    const firmwareReleaseConfig = onlyLocal
        ? { config: local, isRemote: false as const }
        : await getFirmwareReleaseConfig(firmwareChannel);

    const result = await initializeFirmwareConfig(
        firmwareReleaseConfig.config,
        firmwareReleaseConfig.isRemote,
    );
    releases = result.releases;
    intermediary = result.intermediaries;
};

export const getLocal = (): FirmwareReleaseConfig => local;
export const getReleases = () => releases;
export const getIntermediary = () => intermediary;
