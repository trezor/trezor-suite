import { convertCryptoToFiatAmount } from '../convertCryptoToFiatAmount';

const rate = 22666;

describe('Convert crypto to fiat amount', () => {
    it('converts correctly', () => {
        expect(
            convertCryptoToFiatAmount({
                value: '0',
                rate,
                network: 'btc',
            }),
        ).toBe('0.00');

        expect(
            convertCryptoToFiatAmount({
                value: '250',
                rate,
                network: 'btc',
            }),
        ).toBe('0.06');

        expect(
            convertCryptoToFiatAmount({
                value: '100000000',
                rate,
                network: 'btc',
            }),
        ).toBe('22666.00');

        expect(
            convertCryptoToFiatAmount({
                value: null,
                rate,
                network: 'btc',
            }),
        ).toBe(null);
    });
});
