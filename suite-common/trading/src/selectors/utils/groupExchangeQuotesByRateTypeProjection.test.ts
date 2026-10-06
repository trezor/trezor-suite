import { type ExchangeTrade } from 'invity-api';

import { groupExchangeQuotesByRateTypeProjection } from './groupExchangeQuotesByRateTypeProjection';

describe(groupExchangeQuotesByRateTypeProjection.name, () => {
    it('groups quotes into fixed and float only', () => {
        const quotes = [
            {
                exchange: '1inch',
                quoteId: 'dex-quote',
                isDex: true,
            } as ExchangeTrade,
            {
                exchange: 'changellyfr',
                quoteId: 'fixed-quote',
            } as ExchangeTrade,
            {
                exchange: 'changelly',
                quoteId: 'float-quote',
            } as ExchangeTrade,
            {
                exchange: 'changenow',
                quoteId: 'float-quote-2',
            } as ExchangeTrade,
            {
                exchange: 'unknown-provider',
                quoteId: 'fallback-float-quote',
            } as ExchangeTrade,
        ];

        const providers = {
            changellyfr: { isFixedRate: true },
            changelly: { isFixedRate: false },
            changenow: { isFixedRate: false },
        };

        const groupedQuotes = groupExchangeQuotesByRateTypeProjection(quotes, providers);

        expect(groupedQuotes.fixed).toEqual([quotes[1]]);
        expect(groupedQuotes.float).toEqual([quotes[0], quotes[2], quotes[3], quotes[4]]);
    });
});
