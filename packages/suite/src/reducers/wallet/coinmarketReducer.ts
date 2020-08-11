import produce from 'immer';
import { WalletAction } from '@wallet-types';
import { BuyTrade, BuyTradeQuoteRequest, BuyTradeResponse } from 'invity-api';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { COINMARKET_BUY } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { Action as SuiteAction } from '@suite-types';

interface Buy {
    buyInfo?: BuyInfo;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    alternativeQuotes?: BuyTrade[];
    addressVerified: boolean;
    trades: BuyTradeResponse[];
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
        trades: [],
    },
};

export default (state: State = initialState, action: WalletAction | SuiteAction): State => {
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
            case COINMARKET_BUY.SAVE_TRADE:
                draft.buy.trades.push(action.buyTradeResponse);
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.coinmarket;
            // no default
        }
    });
};
