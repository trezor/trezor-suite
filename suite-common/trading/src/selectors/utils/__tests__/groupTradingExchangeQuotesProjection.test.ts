import { type ExchangeTrade } from 'invity-api';

import { groupTradingExchangeQuotesProjection } from '../groupTradingExchangeQuotesProjection';

describe(groupTradingExchangeQuotesProjection.name, () => {
    it('groups quotes into dex, fixed and float groups', () => {
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

        const groupedQuotes = groupTradingExchangeQuotesProjection(quotes, providers);

        expect(groupedQuotes.dex).toEqual([quotes[0]]);
        expect(groupedQuotes.fixed).toEqual([quotes[1]]);
        expect(groupedQuotes.float).toEqual([quotes[2], quotes[3], quotes[4]]);
    });
});
