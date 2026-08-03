import { mostCommon, pickCanonicalVersion, stripRangePrefix } from './versions';

describe('stripRangePrefix', () => {
    it.each([
        ['^4.17.21', '4.17.21'],
        ['~1.2.3', '1.2.3'],
        ['>=2.0.0', '2.0.0'],
        ['10.0.0-beta.1', '10.0.0-beta.1'],
        ['1.0.0', '1.0.0'],
    ])('strips %s -> %s', (input, expected) => {
        expect(stripRangePrefix(input)).toBe(expected);
    });
});

describe('pickCanonicalVersion', () => {
    it('returns the most frequent version', () => {
        expect(pickCanonicalVersion(['^4.17.21', '^4.17.21', '^4.17.15'])).toBe('^4.17.21');
    });

    it('breaks frequency ties by the numerically higher version', () => {
        expect(pickCanonicalVersion(['^9.5.0', '^10.2.0'])).toBe('^10.2.0');
    });

    it('compares bare and prefixed specifiers consistently', () => {
        expect(pickCanonicalVersion(['1.0.0-alpha.1', '10.0.0-beta.1'])).toBe('10.0.0-beta.1');
    });

    it('returns an empty string for empty input', () => {
        expect(pickCanonicalVersion([])).toBe('');
    });
});

describe('mostCommon', () => {
    it('returns the most frequent value', () => {
        expect(mostCommon(['a', 'a', 'b'])).toBe('a');
    });

    it('deep-compares object values', () => {
        const repo = { type: 'git', url: 'git://example' };
        expect(mostCommon([repo, { type: 'git', url: 'git://example' }, { url: 'other' }])).toEqual(
            repo,
        );
    });

    it('breaks ties deterministically regardless of input order', () => {
        expect(mostCommon(['b', 'a'])).toBe('a');
        expect(mostCommon(['a', 'b'])).toBe('a');
    });

    it('returns undefined for empty input', () => {
        expect(mostCommon([])).toBeUndefined();
    });
});
