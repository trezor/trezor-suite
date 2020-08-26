import produce from 'immer';
import { WalletAction, Account } from '@wallet-types';
import {
    BuyTrade,
    BuyTradeQuoteRequest,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
} from 'invity-api';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { ExchangeInfo } from '@suite/actions/wallet/coinmarketExchangeActions';
import { COINMARKET_BUY, COINMARKET_EXCHANGE } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { Action as SuiteAction } from '@suite-types';

type CommonTrade = {
    date: string;
    key?: string;
    account: {
        deviceState: Account['deviceState'];
        symbol: Account['symbol'];
        accountType: Account['accountType'];
        accountIndex: Account['index'];
    };
};

export type Trade =
    | (CommonTrade & { tradeType: 'buy'; data: BuyTrade })
    | (CommonTrade & { tradeType: 'exchange'; data: ExchangeTrade });

interface Buy {
    buyInfo?: BuyInfo;
    transactionId?: string;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    alternativeQuotes?: BuyTrade[];
    addressVerified: boolean;
}

interface Exchange {
    exchangeInfo?: ExchangeInfo;
    transactionId?: string;
    quotesRequest?: ExchangeTradeQuoteRequest;
    fixedQuotes: ExchangeTrade[];
    floatQuotes: ExchangeTrade[];
    addressVerified: boolean;
}

interface State {
    buy: Buy;
    exchange: Exchange;
    trades: Trade[];
}

const initialState = {
    buy: {
        buyInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        quotes: [],
        alternativeQuotes: undefined,
        addressVerified: false,
    },
    exchange: {
        exchangeInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        fixedQuotes: [],
        floatQuotes: [],
        addressVerified: false,
    },
    trades: [],
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
            case COINMARKET_BUY.SAVE_TRANSACTION_ID:
                draft.buy.transactionId = action.transactionId;
                break;
            case COINMARKET_BUY.SAVE_QUOTES:
                draft.buy.quotes = action.quotes;
                draft.buy.alternativeQuotes = action.alternativeQuotes;
                break;
            case COINMARKET_BUY.VERIFY_ADDRESS:
                draft.buy.addressVerified = action.addressVerified;
                break;

            case COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO:
                draft.exchange.exchangeInfo = action.exchangeInfo;
                break;
            case COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST:
                draft.exchange.quotesRequest = action.request;
                break;
            case COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID:
                draft.exchange.transactionId = action.transactionId;
                break;
            case COINMARKET_EXCHANGE.SAVE_QUOTES:
                draft.exchange.fixedQuotes = action.fixedQuotes;
                draft.exchange.floatQuotes = action.floatQuotes;
                break;
            case COINMARKET_EXCHANGE.VERIFY_ADDRESS:
                draft.exchange.addressVerified = action.addressVerified;
                break;

            case STORAGE.LOADED:
                return action.payload.wallet.coinmarket;
            // no default
        }
    });
};
