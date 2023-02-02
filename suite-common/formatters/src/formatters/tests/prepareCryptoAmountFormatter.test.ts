import { PROTO } from '@trezor/connect';

import { prepareCryptoAmountFormatter } from '../prepareCryptoAmountFormatter';

const CryptoAmountFormatter = prepareCryptoAmountFormatter({
    coins: [],
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    // @ts-expect-error - no need to test it with Intl for now
    intl: {},
});

describe('CryptoAmountFormatter', () => {
    describe('formats correctly', () => {
        it('converts correctly', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'btc',
                }),
            ).toBe('0.000003 BTC');
        });

        it('without symbol', () => {
            expect(
                CryptoAmountFormatter.format('300', {
                    symbol: 'btc',
                    withSymbol: false,
                }),
            ).toBe('0.000003');
        });

        it('isBalance true crops length', () => {
            expect(
                CryptoAmountFormatter.format('0.020638700284758254', {
                    symbol: 'eth',
                    isBalance: true,
                }),
            ).toBe('0.0206387… ETH');
        });
    });
});
