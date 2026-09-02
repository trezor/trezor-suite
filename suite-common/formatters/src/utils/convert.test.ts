import { asNetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

import { convertCryptoToFiatAmount } from './convert';

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
                symbol: asNetworkSymbol('btc'),
                isAmountInSats,
                rate: 22666,
            }),
        ).toEqual(expectedAmount);
    });
});
