import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { getFirmwareVersion } from '@trezor/device-utils';
import * as helpers from '@trezor/env-utils';

import { buildUserFeedbackData } from '../src/userData';

describe(buildUserFeedbackData.name, () => {
    beforeEach(() => {
        jest.spyOn(helpers, 'getEnvironment').mockReturnValue('desktop');
        jest.spyOn(helpers, 'getOsName').mockReturnValue('linux');
        jest.spyOn(helpers, 'getUserAgent').mockReturnValue('user-agent');
        jest.spyOn(helpers, 'getSuiteVersion').mockReturnValue('25.7.0');
        jest.spyOn(helpers, 'getCommitHash').mockReturnValue('commit-hash');
        jest.spyOn(helpers, 'getWindowWidth').mockReturnValue(1920);
        jest.spyOn(helpers, 'getWindowHeight').mockReturnValue(1080);
    });

    it('returns full payload when device is connected', () => {
        const device = mockSuiteDevice();

        const data = buildUserFeedbackData(device);

        expect(data).toEqual({
            platform: 'desktop',
            os: 'linux',
            user_agent: 'user-agent',
            suite_version: '25.7.0',
            suite_revision: 'commit-hash',
            window_dimensions: '1920x1080',
            device_model: device?.features?.internal_model,
            firmware_version: device?.features ? getFirmwareVersion(device) : '',
            firmware_revision: device?.features?.revision || '',
            firmware_type: device?.firmwareType || '',
        });
    });

    it('omits device info when no device is connected', () => {
        const data = buildUserFeedbackData(undefined);

        expect(data.device_model).toBeUndefined();
        expect(data.firmware_version).toBe('');
        expect(data.firmware_revision).toBe('');
        expect(data.firmware_type).toBe('');
    });
});
