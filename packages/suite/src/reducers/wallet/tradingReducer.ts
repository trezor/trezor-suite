import produce from 'immer';
import type {
    BuyTrade,
    BuyTradeQuoteRequest,
    Coins,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeQuoteRequest,
    Platforms,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import type {
    TradingPaymentMethodListProps,
    TradingTransaction,
    TradingType,
} from '@suite-common/trading';
import type { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import type { FeeLevel } from '@trezor/connect';

import { STORAGE } from 'src/actions/suite/constants';
import {
    TRADING_BUY,
    TRADING_COMMON,
    TRADING_EXCHANGE,
    TRADING_INFO,
    TRADING_SELL,
} from 'src/actions/wallet/constants';
import type { BuyInfo } from 'src/actions/wallet/tradingBuyActions';
import type { ExchangeInfo } from 'src/actions/wallet/tradingExchangeActions';
import type { SellInfo } from 'src/actions/wallet/tradingSellActions';
import { AppState } from 'src/reducers/store';
import { Action } from 'src/types/suite';

export interface ComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        'feePerByte' | 'estimatedFeeLimit' | 'feeLimit' | 'token' | 'fee'
    >;
    selectedFee?: FeeLevel['label'];
}

export interface TradingTradeCommonProps {
    transactionId?: string;
}

interface Info {
    platforms?: Platforms;
    coins?: Coins;
    paymentMethods: TradingPaymentMethodListProps[];
}

interface Buy extends TradingTradeCommonProps {
    buyInfo?: BuyInfo;
    isFromRedirect: boolean;
    quotesRequest?: BuyTradeQuoteRequest;
    quotes: BuyTrade[] | undefined;
    selectedQuote: BuyTrade | undefined;
    addressVerified: string | undefined;
}

interface Exchange extends TradingTradeCommonProps {
    exchangeInfo?: ExchangeInfo;
    quotesRequest?: ExchangeTradeQuoteRequest;
    quotes: ExchangeTrade[] | undefined;
    addressVerified: string | undefined;
    // internal selected account key in trading section
    tradingAccountKey?: AccountKey;
    selectedQuote: ExchangeTrade | undefined;
    isFromRedirect: boolean;
}

interface Sell extends TradingTradeCommonProps {
    sellInfo?: SellInfo;
    quotesRequest?: SellFiatTradeQuoteRequest;
    quotes: SellFiatTrade[] | undefined;
    selectedQuote: SellFiatTrade | undefined;
    transactionId?: string;
    isFromRedirect: boolean;
    // internal selected account key in trading section
    tradingAccountKey?: AccountKey;
}

export interface State {
    info: Info;
    buy: Buy;
    exchange: Exchange;
    sell: Sell;
    composedTransactionInfo: ComposedTransactionInfo;
    trades: TradingTransaction[];
    modalCryptoId: CryptoId | undefined;
    modalAccountKey: AccountKey | undefined;
    isLoading: boolean;
    lastLoadedTimestamp: number;
    activeSection?: TradingType;
    prefilledFromCryptoId: CryptoId | undefined;
}

export const initialState: State = {
    info: {
        platforms: undefined,
        coins: undefined,
        paymentMethods: [],
    },
    buy: {
        transactionId: undefined,
        isFromRedirect: false,
        buyInfo: undefined,
        quotesRequest: undefined,
        selectedQuote: undefined,
        quotes: [],
        addressVerified: undefined,
    },
    exchange: {
        exchangeInfo: undefined,
        transactionId: undefined,
        quotesRequest: undefined,
        quotes: [],
        addressVerified: undefined,
        tradingAccountKey: undefined,
        selectedQuote: undefined,
        isFromRedirect: false,
    },
    sell: {
        sellInfo: undefined,
        quotesRequest: undefined,
        quotes: [],
        selectedQuote: undefined,
        transactionId: undefined,
        isFromRedirect: false,
        tradingAccountKey: undefined,
    },
    composedTransactionInfo: {},
    trades: [],
    isLoading: false,
    modalAccountKey: undefined,
    modalCryptoId: undefined,
    lastLoadedTimestamp: 0,
    activeSection: 'buy',
    prefilledFromCryptoId: undefined,
};

export const tradingReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.trades = action.payload.tradingTrades || draft.trades;
                break;
            case TRADING_INFO.SAVE_INFO:
                draft.info.platforms = action.info.platforms;
                draft.info.coins = action.info.coins;
                break;
            case TRADING_INFO.SAVE_PAYMENT_METHODS:
                draft.info.paymentMethods = action.paymentMethods;
                break;
            case TRADING_BUY.SAVE_BUY_INFO:
                draft.buy.buyInfo = action.buyInfo;
                break;
            case TRADING_BUY.SET_IS_FROM_REDIRECT:
                draft.buy.isFromRedirect = action.isFromRedirect;
                break;
            case TRADING_BUY.SAVE_QUOTE_REQUEST:
                draft.buy.quotesRequest = action.request;
                break;
            case TRADING_BUY.SAVE_TRANSACTION_DETAIL_ID:
                draft.buy.transactionId = action.transactionId;
                break;
            case TRADING_BUY.SAVE_QUOTES:
                draft.buy.quotes = action.quotes;
                break;
            case TRADING_BUY.SAVE_QUOTE:
                draft.buy.selectedQuote = action.quote;
                break;
            case TRADING_BUY.CLEAR_QUOTES:
                draft.buy.quotes = undefined;
                break;
            case TRADING_BUY.VERIFY_ADDRESS:
                draft.buy.addressVerified = action.addressVerified;
                break;
            case TRADING_BUY.DISPOSE:
                draft.buy.addressVerified = undefined;
                break;
            case TRADING_COMMON.SET_TRADING_FROM_PREFILLED_CRYPTO_ID:
                draft.prefilledFromCryptoId = action.prefilledFromCryptoId;
                break;
            case TRADING_COMMON.SAVE_TRADE:
                if (action.key) {
                    const trades = state.trades.filter(t => t.key !== action.key);
                    const { type, ...trade } = action;
                    trades.push(trade);
                    draft.trades = trades;
                }
                break;
            case TRADING_EXCHANGE.SAVE_EXCHANGE_INFO:
                draft.exchange.exchangeInfo = action.exchangeInfo;
                break;
            case TRADING_EXCHANGE.SAVE_QUOTE_REQUEST:
                draft.exchange.quotesRequest = action.request;
                break;
            case TRADING_EXCHANGE.SAVE_QUOTES:
                draft.exchange.quotes = action.quotes;
                break;
            case TRADING_EXCHANGE.SAVE_QUOTE:
                draft.exchange.selectedQuote = action.quote;
                break;
            case TRADING_EXCHANGE.SET_IS_FROM_REDIRECT:
                draft.exchange.isFromRedirect = action.isFromRedirect;
                break;
            case TRADING_EXCHANGE.VERIFY_ADDRESS:
                draft.exchange.addressVerified = action.addressVerified;
                break;
            case TRADING_EXCHANGE.SAVE_TRANSACTION_ID:
                draft.exchange.transactionId = action.transactionId;
                break;
            case TRADING_EXCHANGE.SET_TRADING_ACCOUNT_KEY:
                draft.exchange.tradingAccountKey = action.accountKey;
                break;
            case TRADING_COMMON.SAVE_COMPOSED_TRANSACTION_INFO:
                draft.composedTransactionInfo = action.info;
                break;
            case TRADING_SELL.SAVE_SELL_INFO:
                draft.sell.sellInfo = action.sellInfo;
                break;
            case TRADING_SELL.SAVE_QUOTE_REQUEST:
                draft.sell.quotesRequest = action.request;
                break;
            case TRADING_SELL.SAVE_QUOTES:
                draft.sell.quotes = action.quotes;
                break;
            case TRADING_SELL.SAVE_QUOTE:
                draft.sell.selectedQuote = action.quote;
                break;
            case TRADING_SELL.SET_IS_FROM_REDIRECT:
                draft.sell.isFromRedirect = action.isFromRedirect;
                break;
            case TRADING_SELL.SAVE_TRANSACTION_ID:
                draft.sell.transactionId = action.transactionId;
                break;
            case TRADING_SELL.SET_TRADING_ACCOUNT_KEY:
                draft.sell.tradingAccountKey = action.accountKey;
                break;
            case TRADING_COMMON.SET_LOADING:
                draft.isLoading = action.isLoading;
                draft.lastLoadedTimestamp = action.lastLoadedTimestamp;
                break;
            case TRADING_COMMON.SET_MODAL_ACCOUNT_KEY:
                draft.modalAccountKey = action.modalAccountKey;
                break;
            case TRADING_COMMON.SET_MODAL_CRYPTO_CURRENCY:
                draft.modalCryptoId = action.modalCryptoId;
                break;
            case TRADING_COMMON.SET_TRADING_ACTIVE_SECTION:
                draft.activeSection = action.activeSection;
                break;
            // no default
        }
    });

export const selectSupportedSymbols =
    (type: TradingType) =>
    (state: AppState): Set<CryptoId> | undefined => {
        const { trading } = state.wallet;
        switch (type) {
            case 'buy':
                return trading.buy.buyInfo?.supportedCryptoCurrencies;
            case 'exchange':
                return trading.exchange.exchangeInfo?.sellSymbols;
            case 'sell':
                return trading.sell.sellInfo?.supportedCryptoCurrencies;
        }
    };
