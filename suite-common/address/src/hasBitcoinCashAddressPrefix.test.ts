import { hasBitcoinCashAddressPrefix } from './hasBitcoinCashAddressPrefix';

describe('hasBitcoinCashAddressPrefix', () => {
    it.each([
        ['', false],
        ['bitcoincash', false],
        ['bitcoincash:', true],
        ['bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', true],
        ['BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC', true],
        ['somethingbitcoincash:something', false],
    ])('%s → %s', (address, expected) => {
        expect(hasBitcoinCashAddressPrefix(address)).toBe(expected);
    });
});
