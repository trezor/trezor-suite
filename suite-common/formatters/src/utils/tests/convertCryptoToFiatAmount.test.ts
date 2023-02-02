import { convertCryptoToFiatAmount } from '../convertCryptoToFiatAmount';
import { coins } from './fixtures/coins';

describe('Convert crypto to fiat amount', () => {
    it('converts correctly', () => {
        expect(
            convertCryptoToFiatAmount({
                value: '0',
                rates: coins.find(coin => coin.symbol === 'btc')!.current.rates!,
                fiatCurrency: 'usd',
                network: 'btc',
            }),
        ).toBe('0.00');

        expect(
            convertCryptoToFiatAmount({
                value: '250',
                rates: coins.find(coin => coin.symbol === 'btc')!.current.rates!,
                fiatCurrency: 'usd',
                network: 'btc',
            }),
        ).toBe('0.06');

        expect(
            convertCryptoToFiatAmount({
                value: '100000000',
                rates: coins.find(coin => coin.symbol === 'btc')!.current.rates!,
                fiatCurrency: 'usd',
                network: 'btc',
            }),
        ).toBe('22666.00');

        expect(
            convertCryptoToFiatAmount({
                value: null,
                rates: coins.find(coin => coin.symbol === 'btc')!.current.rates!,
                fiatCurrency: 'usd',
                network: 'btc',
            }),
        ).toBe(null);
    });
});
