import { areEvmAddressesEqual, checkAddressChecksum, toChecksumAddress } from './evmChecksumUtils';

// Test cases from https://eips.ethereum.org/EIPS/eip-55
// [checksummed, lowercase, uppercase]
const valid = [
    [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed',
        '0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAEd',
    ],
    [
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
        '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359',
        '0xFB6916095CA1DF60BB79CE92CE3EA74C37C5D359',
    ],
    [
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
        '0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb',
        '0xDBF03B407C01E7CD3CBEA99509D93F8DDDC8C6FB',
    ],
    [
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
        '0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb',
        '0xD1220A0CF47C7B9BE7A2E6BA89F429762E7B9ADB',
    ],
] as const;

const invalid = ['', '0x', '0xabcd', '1234', 'štěně'];

describe('evmChecksumUtils', () => {
    it.each(valid)(`checkAddressChecksum: '%s'`, (checksum, lower, upper) => {
        expect(checkAddressChecksum(checksum)).toBe(true);
        expect(checkAddressChecksum(lower)).toBe(false);
        expect(checkAddressChecksum(upper)).toBe(false);
    });

    it.each(invalid)(`checkAddressChecksum: '%s'`, addr => {
        expect(checkAddressChecksum(addr)).toBe(false);
    });

    it.each(valid)(`toChecksumAddress: '%s'`, (checksum, lower, upper) => {
        expect(toChecksumAddress(checksum)).toBe(checksum);
        expect(toChecksumAddress(lower)).toBe(checksum);
        expect(toChecksumAddress(upper)).toBe(checksum);
    });

    it.each(invalid)(`toChecksumAddress: '%s'`, addr => {
        expect(() => toChecksumAddress(addr)).toThrow();
    });
});

describe('areEvmAddressesEqual', () => {
    it.each(valid)(
        `matches the same address regardless of case: '%s'`,
        (checksum, lower, upper) => {
            expect(areEvmAddressesEqual(checksum, lower)).toBe(true);
            expect(areEvmAddressesEqual(lower, upper)).toBe(true);
        },
    );

    it('does not match different addresses', () => {
        expect(areEvmAddressesEqual(valid[0][0], valid[1][0])).toBe(false);
    });

    it('returns false for missing or invalid input', () => {
        expect(areEvmAddressesEqual(undefined, valid[0][0])).toBe(false);
        expect(areEvmAddressesEqual(valid[0][0], null)).toBe(false);
        expect(areEvmAddressesEqual('0xabcd', '0xabcd')).toBe(false);
    });
});
