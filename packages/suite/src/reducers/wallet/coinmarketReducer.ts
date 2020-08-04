import produce from 'immer';
import { WalletAction } from '@wallet-types';
import { BuyTrade, BuyTradeQuoteRequest } from '@suite/services/invityAPI/buyTypes';
import { COINMARKET } from '@wallet-actions/constants';
import { BuyInfo } from '@suite/actions/wallet/coinmarketActions';

// TODO - further split to buy, exchange, spend etc. states

interface State {
    buyInfo: BuyInfo | null;
    quotesRequest: BuyTradeQuoteRequest | null;
    quotes: BuyTrade[];
    alternativeQuotes: BuyTrade[] | undefined;
}

const initialState = {
    buyInfo: null,
    quotesRequest: null,
    quotes: [],
    alternativeQuotes: undefined,
};

export default (state: State = initialState, action: WalletAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case COINMARKET.SAVE_BUY_INFO:
                draft.buyInfo = action.buyInfo;
                break;
            case COINMARKET.SAVE_BUY_QUOTE_REQUEST:
                draft.quotesRequest = action.request;
                break;
            case COINMARKET.SAVE_BUY_QUOTES:
                draft.quotes = action.quotes;
                draft.alternativeQuotes = action.alternativeQuotes;
                break;
            // no default
        }
    });
};
