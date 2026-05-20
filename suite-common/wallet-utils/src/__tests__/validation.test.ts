import { isDecimalsValid, isHexValid, isInteger } from '../validationUtils';

describe('validation', () => {
    it('isDecimalsValid', () => {
        expect(isDecimalsValid('0', 18)).toBe(true);
        expect(isDecimalsValid('0.0', 18)).toBe(true);
        expect(isDecimalsValid('0.00000000', 18)).toBe(true);
        expect(isDecimalsValid('0.00000001', 18)).toBe(true);
        expect(isDecimalsValid('+0.0', 18)).toBe(false);
        expect(isDecimalsValid('-0.0', 18)).toBe(false);
        expect(isDecimalsValid('1', 18)).toBe(true);
        expect(isDecimalsValid('+1', 18)).toBe(false);
        expect(isDecimalsValid('+100000', 18)).toBe(false);
        expect(isDecimalsValid('.', 18)).toBe(false);
        expect(isDecimalsValid('-.1', 18)).toBe(false);
        expect(isDecimalsValid('0.1', 18)).toBe(true);
        expect(isDecimalsValid('0.12314841', 18)).toBe(true);
        expect(isDecimalsValid('0.1381841848184814818391931933', 18)).toBe(false); // 28 decimals
        expect(isDecimalsValid('0.100000000000000000', 18)).toBe(true); // 18s decimals

        expect(isDecimalsValid('100.', 18)).toBe(true);
        expect(isDecimalsValid('.1', 18)).toBe(false);
        expect(isDecimalsValid('.000000001', 18)).toBe(false);
        expect(isDecimalsValid('.13134818481481841', 18)).toBe(false);

        expect(isDecimalsValid('001.12314841', 18)).toBe(false);
        expect(isDecimalsValid('83819319391491949941', 18)).toBe(true);
        expect(isDecimalsValid('-83819319391491949941', 18)).toBe(false);
        expect(isDecimalsValid('+0.131831848184', 18)).toBe(false);
        expect(isDecimalsValid('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(isDecimalsValid('0.131831848184a', 18)).toBe(false);
        expect(isDecimalsValid('100a', 18)).toBe(false);
        expect(isDecimalsValid('.100a', 18)).toBe(false);
        expect(isDecimalsValid('a.100', 18)).toBe(false);
        expect(isDecimalsValid('abc', 18)).toBe(false);
        expect(isDecimalsValid('1abc0', 18)).toBe(false);
    });

    it('isInteger', () => {
        expect(isInteger('0')).toBe(true);
        expect(isInteger('1')).toBe(true);
        expect(isInteger('321')).toBe(true);
        expect(isInteger('01')).toBe(false);
        expect(isInteger('.01')).toBe(false);
        expect(isInteger('0.1')).toBe(false);
        expect(isInteger('01.')).toBe(false);
        expect(isInteger('a01')).toBe(false);
        expect(isInteger('0a1')).toBe(false);
        expect(isInteger('01a')).toBe(false);
    });

    it('isHexValid', () => {
        expect(isHexValid('')).toBe(false);
        expect(isHexValid('1')).toBe(false);
        expect(isHexValid('01')).toBe(true);
        expect(isHexValid('dead')).toBe(true);
        expect(isHexValid('N07Hex')).toBe(false);
        expect(isHexValid('0x0')).toBe(false);
        expect(isHexValid('0x0', '0x')).toBe(true); // eth hex could be left padded (0x0 === 0x00)
        expect(isHexValid('0x00', '0x')).toBe(true);
        expect(isHexValid('0xDeadBeeF', '0x')).toBe(true);
        expect(isHexValid('0xNotHex', '0x')).toBe(false);
        // Solana TX hex examples
        expect(
            isHexValid(
                '0100fe5285137d4b360a7e5670c32b31169e68a6ca8e7fd5850d2ba1376ef840a932da5198d245b65cdf7e623502168e4c751055fcef49b1ddb71446a62b7d1c0f01000204ee2d5f82e922ca83643a2d5f12e93292f18dfcbf38205f7642d96e73973fc9a0c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c600000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000063ebe0204aca594c903658d46c0f24c3aeba6e69bd4c42717afde0545355dc8103020200010c0200000040420f000000000003000903d8d600000000000003000502400d0300',
                '0x',
            ),
        ).toBe(true);
        expect(
            isHexValid(
                '0x0100fe5285137d4b360a7e5670c32b31169e68a6ca8e7fd5850d2ba1376ef840a932da5198d245b65cdf7e623502168e4c751055fcef49b1ddb71446a62b7d1c0f01000204ee2d5f82e922ca83643a2d5f12e93292f18dfcbf38205f7642d96e73973fc9a0c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c600000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000063ebe0204aca594c903658d46c0f24c3aeba6e69bd4c42717afde0545355dc8103020200010c0200000040420f000000000003000903d8d600000000000003000502400d0300',
                '0x',
            ),
        ).toBe(true);
    });
});
