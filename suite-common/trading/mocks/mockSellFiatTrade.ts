import { type SellFiatTrade } from 'invity-api';

import { composeCryptoId } from '../src/utils';

export const mockSellFiatTrade = (trade: Partial<SellFiatTrade> = {}): SellFiatTrade => ({
    exchange: 'btcdirect',
    quoteId: 'quoteId',
    fiatCurrency: 'EUR',
    fiatStringAmount: '10',
    cryptoCurrency: composeCryptoId('bitcoin'),
    cryptoStringAmount: '0.0005',
    paymentMethod: 'bankTransfer',
    ...trade,
});
