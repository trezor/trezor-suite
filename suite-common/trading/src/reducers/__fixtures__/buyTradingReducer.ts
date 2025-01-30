import { TradingBuyState } from '../buyReducer';

export const buyInitialState: TradingBuyState = {
    transactionId: undefined,
    isFromRedirect: false,
    buyInfo: undefined,
    quotesRequest: undefined,
    selectedQuote: undefined,
    quotes: [],
    addressVerified: undefined,
};
