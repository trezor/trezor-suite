import {
    banxaCreditCardSellQuote,
    cexdirectCreditCardBuyQuote,
    invityDexQuote,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { QuoteError } from './QuoteError';

describe('QuoteError', () => {
    it('is an instance of Error', () => {
        const error = new QuoteError('test error', mercuryoApplePayBuyQuote);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(QuoteError);
    });

    it('sets the error message', () => {
        const error = new QuoteError('something went wrong', mercuryoApplePayBuyQuote);

        expect(error.message).toBe('something went wrong');
    });

    describe('buy quote', () => {
        it('extracts buy-specific fields', () => {
            const error = new QuoteError('err', cexdirectCreditCardBuyQuote);

            expect(error.quoteData).toEqual({
                tradeType: 'buy',
                exchange: 'cexdirect',
                fiatStringAmount: '10',
                fiatCurrency: 'EUR',
                receiveCurrency: 'bitcoin',
                receiveStringAmount: '0.0005',
            });
        });
    });

    describe('exchange quote', () => {
        it('extracts exchange-specific fields', () => {
            const error = new QuoteError('err', invityDexQuote);

            expect(error.quoteData).toEqual({
                exchange: 'invity',
                isDex: true,
                receive: 'bitcoin',
                receiveStringAmount: '0.00088076',
                send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                sendStringAmount: '100',
                tradeType: 'exchange',
            });
        });
    });

    describe('sell quote', () => {
        it('extracts sell-specific fields', () => {
            const error = new QuoteError('err', banxaCreditCardSellQuote);

            expect(error.quoteData).toEqual({
                tradeType: 'sell',
                exchange: 'banxa-sell',
                cryptoCurrency: 'ethereum',
                cryptoStringAmount: '0.0233',
                fiatCurrency: 'USD',
                fiatStringAmount: '90.17',
            });
        });
    });
});
