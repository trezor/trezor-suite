import { getReleaseType } from './get-release-type';

describe('getReleaseType', () => {
    it.each([
        ['10.0.0', 'stable'],
        ['9.7.3', 'stable'],
        ['10.0.0-alpha.1', 'alpha'],
        ['10.0.0-alpha.0', 'alpha'],
        ['10.0.0-beta.2', 'canary'],
        ['10.0.0-rc.1', 'canary'],
        ['10.0.0-canary.5', 'canary'],
    ])('classifies %s as %s', (version, expected) => {
        expect(getReleaseType(version)).toBe(expected);
    });
});
