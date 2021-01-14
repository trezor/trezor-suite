import produce from 'immer';
import { WalletAction, Account } from '@wallet-types';
import { ReviewTransactionData } from '@wallet-types/transaction';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';

import {
    BuyTrade,
    BuyTradeQuoteRequest,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
    ExchangeCoinInfo,
} from 'invity-api';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { ExchangeInfo } from '@wallet-actions/coinmarketExchangeActions';
import {
    COINMARKET_BUY,
    COINMARKET_EXCHANGE,
    COINMARKET_COMMON,
    COINMARKET_SELL,
} from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { Action as SuiteAction } from '@suite-types';
import { SellInfo } from '@wallet-actions/coinmarketSellActions';

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
export type TradeExchange = CommonTrade & { tradeType: 'exchange'; data: ExchangeTrade };
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
    addressVerified?: string;
}

interface Exchange {
    exchangeInfo?: ExchangeInfo;
    exchangeCoinInfo?: ExchangeCoinInfo[];
    quotesRequest?: ExchangeTradeQuoteRequest;
    fixedQuotes: ExchangeTrade[];
    floatQuotes: ExchangeTrade[];
    transactionId?: string;
    addressVerified?: string;
}

interface Sell {
    sellInfo?: SellInfo;
    showLeaveModal: boolean;
}

interface State {
    buy: Buy;
    exchange: Exchange;
    sell: Sell;
    transaction: {
        composed?: PrecomposedTransactionFinal;
        reviewData?: ReviewTransactionData;
    };
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
        addressVerified: undefined,
    },
    exchange: {
        exchangeInfo: undefined,
        exchangeCoinInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        fixedQuotes: [],
        floatQuotes: [],
        addressVerified: undefined,
    },
    sell: {
        showLeaveModal: false,
        sellInfo: undefined,
    },
    transaction: {},
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
                draft.buy.addressVerified = undefined;
                break;
            case COINMARKET_EXCHANGE.SAVE_TRADE:
            case COINMARKET_BUY.SAVE_TRADE:
                if (action.key) {
                    const trades = state.trades.filter(t => t.key !== action.key);
                    const { type, ...trade } = action;
                    trades.push(trade);
                    draft.trades = trades;
                }
                break;
            case COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO:
                draft.exchange.exchangeInfo = action.exchangeInfo;
                break;
            case COINMARKET_EXCHANGE.SAVE_EXCHANGE_COIN_INFO:
                draft.exchange.exchangeCoinInfo = action.exchangeCoinInfo;
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
            case COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID:
                draft.exchange.transactionId = action.transactionId;
                break;
            case COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION:
                draft.transaction.composed = action.composedTransaction;
                break;
            case COINMARKET_COMMON.SAVE_TRANSACTION_REVIEW:
                draft.transaction.reviewData = action.reviewData;
                break;
            case STORAGE.LOADED:
                return action.payload.wallet.coinmarket;
            case COINMARKET_SELL.SAVE_SELL_INFO:
                draft.sell.sellInfo = action.sellInfo;
                break;
            case COINMARKET_SELL.SHOW_LEAVE_MODAL:
                draft.sell.showLeaveModal = action.showLeaveModal;
                break;
            // no default
        }
    });
};

export default coinmarketReducer;
