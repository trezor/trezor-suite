import { type TrezorDevice } from '@suite-common/suite-types';
import { type DeviceModelInternal, getFirmwareVersion } from '@trezor/device-utils';
import {
    type Environment,
    getCommitHash,
    getEnvironment,
    getOsName,
    getSuiteVersion,
    getUserAgent,
    getWindowHeight,
    getWindowWidth,
} from '@trezor/env-utils';

export interface UserData {
    platform: Environment;
    os: string;
    user_agent: string;
    suite_version: string;
    suite_revision: string;
    window_dimensions: string;
    device_model?: DeviceModelInternal;
    firmware_version: string;
    firmware_revision: string;
    firmware_type: string;
}

export const buildUserFeedbackData = (device?: TrezorDevice): UserData => ({
    platform: getEnvironment(),
    os: getOsName(),
    user_agent: getUserAgent(),
    suite_version: getSuiteVersion(),
    suite_revision: getCommitHash(),
    window_dimensions: `${getWindowWidth()}x${getWindowHeight()}`,
    device_model: device?.features?.internal_model,
    firmware_version: device?.features ? getFirmwareVersion(device) : '',
    firmware_revision: device?.features?.revision || '',
    firmware_type: device?.firmwareType || '',
});
