import {
    selectTradingBuyQuotesRequest,
    selectTradingSellQuotesRequest,
} from '../selectors/tradingSelectors';
import type { TradingTradeType } from '../types';
import { isBuyTrade, isSellFiatTrade } from '../utils';
import { useSelector } from './useSelector';

export type TradingRequestedSide = 'from' | 'to';

export const useTradingRequestedSide = (
    quote: TradingTradeType | undefined,
): TradingRequestedSide | undefined => {
    const buyQuotesRequest = useSelector(selectTradingBuyQuotesRequest);
    const sellQuotesRequest = useSelector(selectTradingSellQuotesRequest);

    if (!quote) {
        return undefined;
    }

    if (isBuyTrade(quote)) {
        return buyQuotesRequest?.wantCrypto ? 'to' : 'from';
    }

    if (isSellFiatTrade(quote)) {
        return sellQuotesRequest?.amountInCrypto ? 'from' : 'to';
    }

    return undefined;
};
