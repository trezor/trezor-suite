import { BigNumber } from '@trezor/utils';

import { TradingTradeMapProps, TradingType } from '../types';

export const getBestRatedQuote = <T extends TradingType>(
    quotes: TradingTradeMapProps[T][] | undefined,
    type: T,
): TradingTradeMapProps[T] | undefined => {
    const quotesFiltered = quotes?.filter(item => item.rate && item.rate !== 0);

    if (!quotesFiltered || quotesFiltered.length === 0) {
        return undefined;
    }

    const bestRatedQuotes = quotesFiltered.sort((a, b) => {
        const aRate = new BigNumber(a.rate ?? 0);
        const bRate = new BigNumber(b.rate ?? 0);

        // ascending to rate for buy - lower rate more crypto client receives
        if (type === 'buy') {
            return aRate.minus(bRate).toNumber();
        }

        // descending to rate for sell/exchange - higher rate more crypto/fiat client receives
        return bRate.minus(aRate).toNumber();
    });

    return bestRatedQuotes[0];
};
