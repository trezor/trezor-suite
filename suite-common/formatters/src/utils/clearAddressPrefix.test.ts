import { clearAddressPrefix } from './clearAddressPrefix';

describe('clearAddressPrefix', () => {
    test.each([
        ['bitcoincash:qz8gjexl9x7gag53xl08mt7qskvjg8x2wueejjmttc', 'bitcoincash:'],
        ['BITCOINCASH:QZ8GJEXL9X7GAG53XL08MT7QSKVJG8X2WUEEJJMTTC', 'BITCOINCASH:'],
        ['12QeMLzSrB8XH8FvEzPMVoRxVAzTr5XM2y', ''],
    ])('address=%s trims=%s', (address, trimmed) => {
        const clearAddress = clearAddressPrefix(address);
        const trimmedPart = address.replace(clearAddress, '');
        expect(trimmedPart).toEqual(trimmed);
    });
});
