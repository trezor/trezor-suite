import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { getFirmwareVersion } from '@trezor/device-utils';
import {
    getCommitHash,
    getEnvironment,
    getOsName,
    getSuiteVersion,
    getUserAgent,
    getWindowHeight,
    getWindowWidth,
} from '@trezor/env-utils';

import { buildUserFeedbackData } from '../src/userData';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    getEnvironment: jest.fn(),
    getOsName: jest.fn(),
    getUserAgent: jest.fn(),
    getSuiteVersion: jest.fn(),
    getCommitHash: jest.fn(),
    getWindowWidth: jest.fn(),
    getWindowHeight: jest.fn(),
}));

describe(buildUserFeedbackData.name, () => {
    beforeEach(() => {
        (getEnvironment as jest.Mock).mockReturnValue('desktop');
        (getOsName as jest.Mock).mockReturnValue('linux');
        (getUserAgent as jest.Mock).mockReturnValue('user-agent');
        (getSuiteVersion as jest.Mock).mockReturnValue('25.7.0');
        (getCommitHash as jest.Mock).mockReturnValue('commit-hash');
        (getWindowWidth as jest.Mock).mockReturnValue(1920);
        (getWindowHeight as jest.Mock).mockReturnValue(1080);
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
