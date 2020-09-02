import { ExchangeTrade } from 'invity-api';

export interface AmountLimits {
    currency: string;
    min?: number;
    max?: number;
}

// loop through quotes and if all quotes are either with error below minimum or over maximum, return error message
export function getAmountLimits(quotes: ExchangeTrade[]): AmountLimits | undefined {
    let min: number | undefined;
    let max: number | undefined;
    // eslint-disable-next-line no-restricted-syntax
    for (const quote of quotes) {
        let noError = true;
        const amount = Number(quote.sendStringAmount);
        if (quote.min && amount < quote.min) {
            min = Math.min(min || 1e28, quote.min);
            noError = false;
        }
        if (quote.max && quote.max !== 'NONE' && amount > quote.max) {
            max = Math.max(max || 0, quote.max);
            noError = false;
        }
        // if at least one quote succeeded do not return any message
        if (!quote.error && noError) {
            return;
        }
    }
    if (min || max) {
        return { currency: quotes[0].send || '', min, max };
    }
}

export function isQuoteError(quote: ExchangeTrade): boolean {
    if (
        quote.error ||
        !quote.receive ||
        !quote.receiveStringAmount ||
        !quote.sendStringAmount ||
        !quote.send
    ) {
        return true;
    }
    if (quote.min && Number(quote.sendStringAmount) < quote.min) {
        return true;
    }
    if (quote.max && quote.max !== 'NONE' && Number(quote.sendStringAmount) > quote.max) {
        return true;
    }
    return false;
}

// return 3 arrays: quotes not in error, quotes with min/max error, quotes with general error
export function splitQuotes(
    quotes: ExchangeTrade[],
): [ExchangeTrade[], ExchangeTrade[], ExchangeTrade[]] {
    return [
        quotes.filter(q => !isQuoteError(q)),
        quotes.filter(q => isQuoteError(q) && !q.error),
        quotes.filter(q => q.error),
    ];
}
