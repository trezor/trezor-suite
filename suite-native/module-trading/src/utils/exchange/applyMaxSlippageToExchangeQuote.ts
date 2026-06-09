import type { ExchangeTrade } from 'invity-api';

export const applyMaxSlippageToExchangeQuote = (
    quote: ExchangeTrade,
    maxSlippagePercentage: string,
): ExchangeTrade => (quote.isDex ? { ...quote, swapSlippage: maxSlippagePercentage } : quote);
