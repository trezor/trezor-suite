import { getNativeOsVersion, isNative } from '@trezor/env-utils';

import { getOsVersion } from './userAgent';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isNative: jest.fn(),
    getNativeOsVersion: jest.fn(),
}));

describe('getOsVersion', () => {
    it('returns the native OS version on native', async () => {
        jest.mocked(isNative).mockReturnValue(true);
        jest.mocked(getNativeOsVersion).mockReturnValue('17.4');

        expect(await getOsVersion()).toBe('17.4');
    });
});
