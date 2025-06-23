import { idbVersionToSemver, semverToIDBVersion } from '../encode';

const VERSIONS = ['25.9.0', '25.10.0', '25.11.0', '25.11.1', '25.11.2', '25.12.0', '26.1.0'];

describe('IDB Version Encoding', () => {
    it('semverToIDBVersion', () => {
        expect(semverToIDBVersion('1.2.3')).toBe(0x010203);
        expect(semverToIDBVersion('255.255.255')).toBe(0xffffff);

        expect(() => semverToIDBVersion('256.0.0')).toThrow();
        expect(() => semverToIDBVersion('1.2.3-alpha')).toThrow();
        expect(() => semverToIDBVersion('invalid')).toThrow();
    });

    it('idbVersionToSemver', () => {
        expect(idbVersionToSemver(0x010203).version).toBe('1.2.3');
        expect(idbVersionToSemver(0xffffff).version).toBe('255.255.255');

        expect(() => idbVersionToSemver(-1)).toThrow();
        expect(() => idbVersionToSemver(0x01020400)).toThrow();
    });

    it('each next version is greater than the previous one', () => {
        let last = 0;
        VERSIONS.forEach(v => {
            const idbVersion = semverToIDBVersion(v);
            expect(idbVersion).toBeGreaterThanOrEqual(last);
            last = idbVersion;
        });
    });

    it('encode/decode returns initial value', () => {
        VERSIONS.forEach(v => {
            expect(idbVersionToSemver(semverToIDBVersion(v)).version).toBe(v);
        });
    });
});
