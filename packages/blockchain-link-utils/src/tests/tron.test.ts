import { tronAddressToBytes, tronAddressToHex } from '../tron';

describe('tron/tronAddressToBytes', () => {
    it('decodes a valid mainnet address', () => {
        const bytes = tronAddressToBytes('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4');
        expect(bytes).not.toBeNull();
        expect(bytes!.length).toBe(21);
        expect(bytes![0]).toBe(0x41);
    });

    it('returns null for an address with a corrupted checksum', () => {
        expect(tronAddressToBytes('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5')).toBeNull();
    });

    it('returns null for a clearly invalid string', () => {
        expect(tronAddressToBytes('notanaddress')).toBeNull();
    });
});

describe('tron/tronAddressToHex', () => {
    it('converts a valid address to lowercase hex', () => {
        expect(tronAddressToHex('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4')).toBe(
            '41689ac7d52363bedfae8d478f8fa80becc6d00b59',
        );
    });

    it('returns null for an invalid address', () => {
        expect(tronAddressToHex('TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz5')).toBeNull();
    });
});
