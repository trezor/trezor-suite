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
        descriptor: Account['descriptor'];
        symbol: Account['symbol'];
        accountType: Account['accountType'];
        accountIndex: Account['index'];
    };
};

export type TradeBuy = CommonTrade & { tradeType: 'buy'; data: BuyTrade };
export type TradeExchange = CommonTrade & { tradeType: 'buy'; data: BuyTrade };
export type Trade = TradeExchange | TradeBuy;

interface Buy {
    buyInfo?: BuyInfo;
    isFromRedirect: boolean;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[];
    transactionId?: string;
    cachedAccountInfo: {
        accountType?: Account['accountType'];
        index?: Account['index'];
        symbol?: Account['symbol'];
        shouldSubmit?: boolean;
    };
    alternativeQuotes?: BuyTrade[];
    addressVerified: boolean;
}

interface Exchange {
    exchangeInfo?: ExchangeInfo;
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

export const initialState = {
    buy: {
        transactionId: undefined,
        isFromRedirect: false,
        buyInfo: undefined,
        quotesRequest: undefined,
        cachedAccountInfo: {
            accountType: undefined,
            index: undefined,
            symbol: undefined,
            shouldSubmit: false,
        },
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

const coinmarketReducer = (
    state: State = initialState,
    action: WalletAction | SuiteAction,
): State => {
    return produce(state, draft => {
        switch (action.type) {
            case COINMARKET_BUY.SAVE_BUY_INFO:
                draft.buy.buyInfo = action.buyInfo;
                break;
            case COINMARKET_BUY.SET_IS_FROM_REDIRECT:
                draft.buy.isFromRedirect = action.isFromRedirect;
                break;
            case COINMARKET_BUY.SAVE_QUOTE_REQUEST:
                draft.buy.quotesRequest = action.request;
                break;
            case COINMARKET_BUY.SAVE_TRANSACTION_DETAIL_ID:
                draft.buy.transactionId = action.transactionId;
                break;
            case COINMARKET_BUY.SAVE_QUOTES:
                draft.buy.quotes = action.quotes;
                draft.buy.alternativeQuotes = action.alternativeQuotes;
                break;
            case COINMARKET_BUY.VERIFY_ADDRESS:
                draft.buy.addressVerified = action.addressVerified;
                break;
            case COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO:
                draft.buy.cachedAccountInfo = {
                    symbol: action.symbol,
                    index: action.index,
                    accountType: action.accountType,
                    shouldSubmit: action.shouldSubmit,
                };
                break;
            case COINMARKET_BUY.DISPOSE:
                draft.buy.addressVerified = false;
                break;
            case COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO:
                draft.exchange.exchangeInfo = action.exchangeInfo;
                break;

            case COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST:
                draft.exchange.quotesRequest = action.request;
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

export default coinmarketReducer;
