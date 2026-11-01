import { getEnvironment, getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';

import { getSuiteInfo } from './getSuiteInfo';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    getEnvironment: jest.fn(),
    getSuiteVersion: jest.fn(),
    isCodesignBuild: jest.fn(),
}));

const getEnvironmentMock = jest.mocked(getEnvironment);
const getSuiteVersionMock = jest.mocked(getSuiteVersion);
const isCodesignBuildMock = jest.mocked(isCodesignBuild);

describe('getSuiteInfo', () => {
    it.each([
        { environment: 'web', isCodesign: true, build: 'prod' },
        { environment: 'desktop', isCodesign: false, build: 'dev' },
        { environment: 'mobile', isCodesign: true, build: 'prod' },
    ] as const)('describes a $environment $build build', ({ environment, isCodesign, build }) => {
        getEnvironmentMock.mockReturnValue(environment);
        getSuiteVersionMock.mockReturnValue('26.10.1');
        isCodesignBuildMock.mockReturnValue(isCodesign);

        expect(getSuiteInfo()).toEqual({ version: '26.10.1', platform: environment, build });
    });
});
