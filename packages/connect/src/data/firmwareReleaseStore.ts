import type {
    DeviceModelInternal,
    FirmwareType,
    IntermediaryReleaseConfig,
    ReleasesConfig,
} from '@trezor/device-utils';
import { throwError } from '@trezor/utils';

type FirmwareReleaseState = {
    releases: Partial<ReleasesConfig>;
    intermediaries: Partial<Record<DeviceModelInternal, IntermediaryReleaseConfig[]>>;
};

let _state: FirmwareReleaseState | undefined;

export const init = (config: FirmwareReleaseState) => {
    _state = config;
};

const state = () => _state ?? throwError('Firmware release config not loaded.');

export const getReleases = (model: DeviceModelInternal, type: FirmwareType) =>
    state().releases[model]?.[type];

export const getIntermediary = (model: DeviceModelInternal) => state().intermediaries[model];
