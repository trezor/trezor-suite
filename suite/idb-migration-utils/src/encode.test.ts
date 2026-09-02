import { encodeIDBVersion, idbVersionToString } from './encode';

const VERSIONS = [
    '1.2.3',
    '1.2.3.1',
    '1.2.3.2',
    '1.2.4',
    '25.10.0',
    '25.10.0.1',
    '25.10.1',
    '25.11.0',
    '25.11.2',
    '26.0.0',
];

describe('IDB Version Encoding', () => {
    it(encodeIDBVersion.name, () => {
        expect(encodeIDBVersion('1.2.3')).toBe(0x01020300);
        expect(encodeIDBVersion('255.255.255')).toBe(0xffffff00);
        expect(encodeIDBVersion('255.255.255.255')).toBe(0xffffffff);

        expect(() => encodeIDBVersion('256.0.0')).toThrow();
        expect(() => encodeIDBVersion('1.2.3-alpha')).toThrow();
        expect(() => encodeIDBVersion('invalid')).toThrow();
    });

    it(idbVersionToString.name, () => {
        expect(idbVersionToString(0x01020300)).toBe('1.2.3');
        expect(idbVersionToString(0x01020304)).toBe('1.2.3.4');
        expect(idbVersionToString(0x00ffffff)).toBe('255.255.255');
        expect(idbVersionToString(0x00000000)).toBe('0.0.0');
        expect(idbVersionToString(0xffffffff)).toBe('255.255.255.255');

        expect(() => idbVersionToString(-1)).toThrow();
        expect(() => idbVersionToString(0x0102040021)).toThrow();
    });

    it('each next version is greater than the previous one', () => {
        let last = 0;
        VERSIONS.forEach(v => {
            const idbVersion = encodeIDBVersion(v);
            expect(idbVersion).toBeGreaterThanOrEqual(last);
            last = idbVersion;
        });
    });

    it('encode/decode returns initial value', () => {
        VERSIONS.forEach(v => {
            expect(idbVersionToString(encodeIDBVersion(v))).toBe(v);
        });
    });

    it('treats .0 revision as equivalent to 3-part', () => {
        expect(encodeIDBVersion('1.2.3')).toBe(encodeIDBVersion('1.2.3.0'));
        expect(idbVersionToString(encodeIDBVersion('1.2.3.0'))).toBe('1.2.3');
    });

    it('rejects invalid revision values', () => {
        expect(() => encodeIDBVersion('1.2.3.-1')).toThrow();
        expect(() => encodeIDBVersion('1.2.3.256')).toThrow();
        expect(() => encodeIDBVersion('1.2.3.foo')).toThrow();
        expect(() => encodeIDBVersion('1.2.3.1.1')).toThrow();
    });
});
