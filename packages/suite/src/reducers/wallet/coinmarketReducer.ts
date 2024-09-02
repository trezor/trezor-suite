import produce from 'immer';
import type { WalletAction, Account } from 'src/types/wallet';
import type { PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import type {
    BuyTrade,
    BuyTradeQuoteRequest,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
    CryptoSymbolInfo,
    CryptoSymbol,
} from 'invity-api';
import type { BuyInfo } from 'src/actions/wallet/coinmarketBuyActions';
import type { ExchangeInfo } from 'src/actions/wallet/coinmarketExchangeActions';
import {
    COINMARKET_BUY,
    COINMARKET_EXCHANGE,
    COINMARKET_COMMON,
    COINMARKET_SELL,
    COINMARKET_INFO,
} from 'src/actions/wallet/constants';
import { STORAGE } from 'src/actions/suite/constants';
import type { Action as SuiteAction } from 'src/types/suite';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type { FeeLevel } from '@trezor/connect';
import type { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';

export interface ComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        'feePerByte' | 'estimatedFeeLimit' | 'feeLimit' | 'token' | 'fee'
    >;
    selectedFee?: FeeLevel['label'];
}

export interface CoinmarketTradeCommonProps {
    transactionId?: string;
}

interface Info {
    symbolsInfo?: CryptoSymbolInfo[];
    paymentMethods: CoinmarketPaymentMethodListProps[];
}

interface Buy extends CoinmarketTradeCommonProps {
    buyInfo?: BuyInfo;
    isFromRedirect: boolean;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[] | undefined;
    selectedQuote: BuyTrade | undefined;
    cachedAccountInfo: {
        accountType?: Account['accountType'];
        index?: Account['index'];
        symbol?: Account['symbol'];
        shouldSubmit?: boolean;
    };
    addressVerified?: string;
}

interface Exchange extends CoinmarketTradeCommonProps {
    exchangeInfo?: ExchangeInfo;
    quotesRequest?: ExchangeTradeQuoteRequest;
    quotes: ExchangeTrade[] | undefined;
    addressVerified?: string;
    coinmarketAccount?: Account;
    selectedQuote: ExchangeTrade | undefined;
}

interface Sell extends CoinmarketTradeCommonProps {
    sellInfo?: SellInfo;
    quotesRequest?: SellFiatTradeQuoteRequest;
    quotes: SellFiatTrade[] | undefined;
    selectedQuote: SellFiatTrade | undefined;
    transactionId?: string;
    isFromRedirect: boolean;
    coinmarketAccount?: Account;
}

export interface State {
    info: Info;
    buy: Buy;
    exchange: Exchange;
    sell: Sell;
    composedTransactionInfo: ComposedTransactionInfo;
    trades: Trade[];
    modalCryptoSymbol: CryptoSymbol | undefined;
    isLoading: boolean;
    lastLoadedTimestamp: number;
}

export const initialState: State = {
    info: {
        symbolsInfo: [],
        paymentMethods: [],
    },
    buy: {
        transactionId: undefined,
        isFromRedirect: false,
        buyInfo: undefined,
        quotesRequest: undefined,
        selectedQuote: undefined,
        cachedAccountInfo: {
            accountType: undefined,
            index: undefined,
            symbol: undefined,
            shouldSubmit: false,
        },
        quotes: [],
        addressVerified: undefined,
    },
    exchange: {
        exchangeInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        quotes: [],
        addressVerified: undefined,
        coinmarketAccount: undefined,
        selectedQuote: undefined,
    },
    sell: {
        sellInfo: undefined,
        quotesRequest: undefined,
        quotes: [],
        selectedQuote: undefined,
        transactionId: undefined,
        isFromRedirect: false,
        coinmarketAccount: undefined,
    },
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalCryptoSymbol: undefined,
    lastLoadedTimestamp: 0,
};

const coinmarketReducer = (
    state: State = initialState,
    action: WalletAction | SuiteAction,
): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.trades = action.payload.coinmarketTrades || draft.trades;
                break;
            case COINMARKET_INFO.SAVE_SYMBOLS_INFO:
                draft.info.symbolsInfo = action.symbolsInfo;
                break;
            case COINMARKET_INFO.SAVE_PAYMENT_METHODS:
                draft.info.paymentMethods = action.paymentMethods;
                break;
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
                break;
            case COINMARKET_BUY.SAVE_QUOTE:
                draft.buy.selectedQuote = action.quote;
                break;
            case COINMARKET_BUY.CLEAR_QUOTES:
                draft.buy.quotes = undefined;
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
            case COINMARKET_COMMON.SAVE_TRADE:
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
            case COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST:
                draft.exchange.quotesRequest = action.request;
                break;
            case COINMARKET_EXCHANGE.SAVE_QUOTES:
                draft.exchange.quotes = action.quotes;
                break;
            case COINMARKET_EXCHANGE.SAVE_QUOTE:
                draft.exchange.selectedQuote = action.quote;
                break;
            case COINMARKET_EXCHANGE.CLEAR_QUOTES:
                draft.exchange.quotes = undefined;
                break;
            case COINMARKET_EXCHANGE.VERIFY_ADDRESS:
                draft.exchange.addressVerified = action.addressVerified;
                break;
            case COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID:
                draft.exchange.transactionId = action.transactionId;
                break;
            case COINMARKET_EXCHANGE.SET_COINMARKET_ACCOUNT:
                draft.exchange.coinmarketAccount = action.account;
                break;
            case COINMARKET_COMMON.SAVE_COMPOSED_TRANSACTION_INFO:
                draft.composedTransactionInfo = action.info;
                break;
            case COINMARKET_SELL.SAVE_SELL_INFO:
                draft.sell.sellInfo = action.sellInfo;
                break;
            case COINMARKET_SELL.SAVE_QUOTE_REQUEST:
                draft.sell.quotesRequest = action.request;
                break;
            case COINMARKET_SELL.SAVE_QUOTES:
                draft.sell.quotes = action.quotes;
                break;
            case COINMARKET_SELL.SAVE_QUOTE:
                draft.sell.selectedQuote = action.quote;
                break;
            case COINMARKET_SELL.CLEAR_QUOTES:
                draft.sell.quotes = undefined;
                break;
            case COINMARKET_SELL.SET_IS_FROM_REDIRECT:
                draft.sell.isFromRedirect = action.isFromRedirect;
                break;
            case COINMARKET_SELL.SAVE_TRANSACTION_ID:
                draft.sell.transactionId = action.transactionId;
                break;
            case COINMARKET_SELL.SET_COINMARKET_ACCOUNT:
                draft.sell.coinmarketAccount = action.account;
                break;
            case COINMARKET_COMMON.SET_LOADING:
                draft.isLoading = action.isLoading;
                draft.lastLoadedTimestamp = action.lastLoadedTimestamp;
                break;
            case COINMARKET_COMMON.SET_MODAL_CRYPTO_CURRENCY:
                draft.modalCryptoSymbol = action.modalCryptoSymbol;
                break;
            // no default
        }
    });

export default coinmarketReducer;
