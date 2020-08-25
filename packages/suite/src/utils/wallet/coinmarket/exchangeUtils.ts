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
