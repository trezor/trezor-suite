import { BigNumber } from '@trezor/utils';

import { convertCryptoToFiatAmount, convertFiatToCryptoAmount } from '../convert';

describe('convertCryptoToFiatAmount', () => {
    test.each([
        [null, undefined, null],
        [null, true, null],
        [null, false, null],
        ['0', undefined, new BigNumber('0.00')],
        ['0', true, new BigNumber('0.00')],
        ['0', false, new BigNumber('0.00')],
        ['1', undefined, new BigNumber('0.00022666')],
        ['1', true, new BigNumber('0.00022666')],
        ['1', false, new BigNumber('22666.00')],
        ['250', undefined, new BigNumber('0.056665')],
        ['250', true, new BigNumber('0.056665')],
        ['0.00000250', false, new BigNumber('0.056665')],
        ['100000000', undefined, new BigNumber('22666.00')],
        ['100000000', true, new BigNumber('22666.00')],
        ['1.00000000', false, new BigNumber('22666.00')],
    ])('amount=%s isAmountInSats=%s', (amount, isAmountInSats, expectedAmount) => {
        expect(
            convertCryptoToFiatAmount({
                amount,
                symbol: 'btc',
                isAmountInSats,
                rate: 22666,
            }),
        ).toEqual(expectedAmount);
    });
});

describe('convertFiatToCryptoAmount', () => {
    test.each([
        [null, undefined, null],
        [null, true, null],
        [null, false, null],
        ['0.00', undefined, new BigNumber('0')],
        ['0.00', true, new BigNumber('0')],
        ['0.00', false, new BigNumber('0.00000000')],
        ['0.06', undefined, new BigNumber('264.71366804906')],
        ['0.06', true, new BigNumber('264.71366804906')],
        ['0.06', false, new BigNumber('0.0000026471366804906')],
        ['22666.00', undefined, new BigNumber('100000000')],
        ['22666.00', true, new BigNumber('100000000')],
        ['22666.00', false, new BigNumber('1.00000000')],
    ])('amount=%s isAmountInSats=%s', (amount, isAmountInSats, expectedAmount) => {
        expect(
            convertFiatToCryptoAmount({
                amount,
                symbol: 'btc',
                isAmountInSats,
                rate: 22666,
            }),
        ).toEqual(expectedAmount);
    });
});
