import { convertCryptoToFiatAmount, convertFiatToCryptoAmount } from '../convert';

describe('convertCryptoToFiatAmount', () => {
    test.each([
        [null, undefined, null],
        [null, true, null],
        [null, false, null],
        ['0', undefined, '0.00'],
        ['0', true, '0.00'],
        ['0', false, '0.00'],
        ['1', undefined, '0.00'],
        ['1', true, '0.00'],
        ['1', false, '22666.00'],
        ['250', undefined, '0.06'],
        ['250', true, '0.06'],
        ['0.00000250', false, '0.06'],
        ['100000000', undefined, '22666.00'],
        ['100000000', true, '22666.00'],
        ['1.00000000', false, '22666.00'],
    ])('amount=%s isAmountInSats=%s', (amount, isAmountInSats, expectedAmount) => {
        expect(
            convertCryptoToFiatAmount({
                amount,
                networkSymbol: 'btc',
                isAmountInSats,
                rate: 22666,
            }),
        ).toBe(expectedAmount);
    });
});

describe('convertFiatToCryptoAmount', () => {
    test.each([
        [null, undefined, null],
        [null, true, null],
        [null, false, null],
        ['0.00', undefined, '0'],
        ['0.00', true, '0'],
        ['0.00', false, '0.00000000'],
        ['0.06', undefined, '265'],
        ['0.06', true, '265'],
        ['0.06', false, '0.00000265'],
        ['22666.00', undefined, '100000000'],
        ['22666.00', true, '100000000'],
        ['22666.00', false, '1.00000000'],
    ])('amount=%s isAmountInSats=%s', (amount, isAmountInSats, expectedAmount) => {
        expect(
            convertFiatToCryptoAmount({
                amount,
                networkSymbol: 'btc',
                isAmountInSats,
                rate: 22666,
            }),
        ).toBe(expectedAmount);
    });
});
