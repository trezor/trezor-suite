import produce from 'immer';
import { WalletAction } from '@wallet-types';
import { BuyTrade, BuyTradeQuoteRequest, BuyListResponse } from 'invity-api';
import { COINMARKET_BUY } from '@wallet-actions/constants';

interface Buy {
    buyInfo?: BuyListResponse;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    alternativeQuotes: BuyTrade[] | undefined;
    addressVerified: boolean;
}

interface State {
    buy: Buy;
}

const initialState = {
    buy: {
        buyInfo: undefined,
        quotesRequest: undefined,
        quotes: [],
        alternativeQuotes: undefined,
        addressVerified: false,
    },
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case COINMARKET_BUY.SAVE_BUY_INFO:
                draft.buy.buyInfo = action.buyInfo;
                break;
            case COINMARKET_BUY.SAVE_QUOTE_REQUEST:
                draft.buy.quotesRequest = action.request;
                break;
            case COINMARKET_BUY.SAVE_QUOTES:
                draft.buy.quotes = action.quotes;
                draft.buy.alternativeQuotes = action.alternativeQuotes;
                break;
            case COINMARKET_BUY.VERIFY_ADDRESS:
                draft.buy.addressVerified = action.addressVerified;
                break;
            // no default
        }
    });
};
