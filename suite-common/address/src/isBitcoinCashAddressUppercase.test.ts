import { isBitcoinCashAddressUppercase } from './isBitcoinCashAddressUppercase';

describe('isBitcoinCashAddressUppercase', () => {
    it.each([
        ['', false],
        ['bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', false],
        ['BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC', true],
        ['1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', false],
        ['1BPEI6DFDAUFD7GTITTLSDBEYJVCOAVGGU', false],
        ['NotValidAddressContainsBITCOINCASH:BCHTEST:1', false],
    ])('%s → %s', (address, expected) => {
        expect(isBitcoinCashAddressUppercase(address)).toBe(expected);
    });
});
