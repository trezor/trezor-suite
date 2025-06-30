import { TrezorDevice } from '@suite-common/suite-types';
import { getFirmwareVersion } from '@trezor/device-utils';
import {
    getCommitHash,
    getEnvironment,
    getOsName,
    getSuiteVersion,
    getUserAgent,
    getWindowHeight,
    getWindowWidth,
    isCodesignBuild,
} from '@trezor/env-utils';

import { FEEDBACK_ENDPOINT } from './constants';
import { FeedbackType, UserData } from './types';

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

export const getFeedbackUrl = (type: FeedbackType) => {
    const typeUri = type === 'BUG' ? 'bugs' : 'feedback';
    const base = `${FEEDBACK_ENDPOINT}/${typeUri}`;

    if (isCodesignBuild()) {
        return `${base}/stable.log`;
    }

    return `${base}/develop.log`;
};
