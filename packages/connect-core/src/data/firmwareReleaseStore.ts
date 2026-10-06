import type {
    DeviceModelInternal,
    FirmwareType,
    IntermediariesConfig,
    ReleasesConfig,
} from '@trezor/device-utils';
import { throwError } from '@trezor/utils';

export type FirmwareReleaseState = {
    releases: Partial<ReleasesConfig>;
    intermediaries: Partial<IntermediariesConfig>;
};

let _state: FirmwareReleaseState | undefined;

export const init = (config: FirmwareReleaseState) => {
    _state = config;
};

const getStateOrThrow = () => _state ?? throwError('Firmware release config not loaded.');

export const getReleases = (model: DeviceModelInternal, type: FirmwareType) =>
    getStateOrThrow().releases[model]?.[type];

export const getIntermediary = (model: DeviceModelInternal) =>
    getStateOrThrow().intermediaries[model];
