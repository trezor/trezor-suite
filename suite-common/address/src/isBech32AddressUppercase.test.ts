import { isBech32AddressUppercase } from './isBech32AddressUppercase';

describe('isBech32AddressUppercase', () => {
    it('returns false for empty string', () => {
        expect(isBech32AddressUppercase('')).toBe(false);
    });

    it('returns false for lowercase bech32 addresses', () => {
        expect(isBech32AddressUppercase('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj')).toBe(false);
        expect(isBech32AddressUppercase('tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9')).toBe(false);
        expect(isBech32AddressUppercase('ltc1qkzyarpkhdecu5rzeuj78pwpr5sfm798afny4n6')).toBe(false);
    });

    it('returns true for uppercase bech32 addresses', () => {
        expect(isBech32AddressUppercase('BC1SW50QA3JX3S')).toBe(true);
        expect(isBech32AddressUppercase('TB1QKVWU9G3K2PDXEWFQR7SYZ89R3GJ557L3UUF9R9')).toBe(true);
        expect(isBech32AddressUppercase('LTC1QKZYARPKHDECU5RZEUJ78PWPR5SFM798AFNY4N6')).toBe(true);
    });

    it('returns false for non-bech32 addresses containing bech32 prefixes', () => {
        expect(isBech32AddressUppercase('37VJHKeBA9DHKmTwYE7TWYjwDzo5JTb1sz')).toBe(false);
        expect(isBech32AddressUppercase('NotValidAddressContainsTb1bc1Ltc1Tltc1')).toBe(false);
    });
});
