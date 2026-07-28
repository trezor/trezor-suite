import { parseIdbVersion } from './parseIdbVersion';

describe(parseIdbVersion.name, () => {
    it('parses x.y.z with revision=0', () => {
        const result = parseIdbVersion('1.2.3');
        expect(result.semver.version).toBe('1.2.3');
        expect(result.revision).toBe(0);
        expect(result.versionString).toBe('1.2.3');
    });

    it('parses x.y.z.r with revision', () => {
        const result = parseIdbVersion('25.7.0.1');
        expect(result.semver.version).toBe('25.7.0');
        expect(result.revision).toBe(1);
        expect(result.versionString).toBe('25.7.0.1');
    });

    it('trims whitespace around the version', () => {
        const cases = [' 2.5.3 ', ' 2 . 5 . 3 '];
        cases.forEach(raw => {
            const result = parseIdbVersion(raw);
            expect(result.semver.version).toBe('2.5.3');
            expect(result.revision).toBe(0);
        });
    });

    it('handles boundary values (0 and 255)', () => {
        const min = parseIdbVersion('0.0.0');
        expect(min.semver.version).toBe('0.0.0');
        expect(min.revision).toBe(0);

        const max = parseIdbVersion('255.255.255.255');
        expect(max.semver.version).toBe('255.255.255');
        expect(max.revision).toBe(255);
    });

    it('rejects invalid shapes or empty segments', () => {
        for (const raw of ['1.2', '1.2.3.4.5', '1.2.3.', '1..3', '   ']) {
            expect(() => parseIdbVersion(raw)).toThrow();
        }
    });

    it('rejects non-decimal or malformed numeric parts', () => {
        for (const raw of ['0x1.2.3', '1e2.2.3', '+1.2.3', '1.2.3.1.']) {
            expect(() => parseIdbVersion(raw)).toThrow();
        }
    });

    it('rejects out-of-range parts', () => {
        for (const raw of ['256.0.0', '1.256.3', '1.2.300', '1.2.3.256']) {
            expect(() => parseIdbVersion(raw)).toThrow();
        }
    });

    it('rejects prerelease tags', () => {
        for (const raw of ['1.2.3-alpha', '1.2.3-rc.1']) {
            expect(() => parseIdbVersion(raw)).toThrow();
        }
    });
});
