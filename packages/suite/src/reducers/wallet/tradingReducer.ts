import { produce } from 'immer';
import type {
    Coins,
    CryptoId,
    Platforms,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
} from 'invity-api';

import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TradingPaymentMethodListProps,
    TradingPreffiledFromAccount,
    type TradingTransaction,
    type TradingType,
    selectTradingBuyInfo,
    selectTradingExchangeInfo,
} from '@suite-common/trading';
import type { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import type { FeeLevel } from '@trezor/connect';

import { STORAGE } from 'src/actions/suite/constants';
import { TRADING_COMMON, TRADING_INFO, TRADING_SELL } from 'src/actions/wallet/constants';
import type { SellInfo, TradingSellInfoSelector } from 'src/actions/wallet/tradingSellActions';
import { AppState } from 'src/reducers/store';
import { Action } from 'src/types/suite';

export interface ComposedTransactionInfo {
    composed?: Pick<
        PrecomposedTransactionFinal,
        | 'feePerByte'
        | 'estimatedFeeLimit'
        | 'feeLimit'
        | 'token'
        | 'fee'
        | 'maxFeePerGas'
        | 'maxPriorityFeePerGas'
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
    sell: Sell;
    composedTransactionInfo: ComposedTransactionInfo;
    trades: TradingTransaction[];
    modalCryptoId: CryptoId | undefined;
    modalAccountKey: AccountKey | undefined;
    isLoading: boolean;
    lastLoadedTimestamp: number;
    activeSection?: TradingType;
    prefilledFromAccount: TradingPreffiledFromAccount;
}

export const initialState: State = {
    info: {
        platforms: undefined,
        coins: undefined,
        paymentMethods: [],
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
    activeSection: 'sell',
    prefilledFromAccount: {
        cryptoId: undefined,
        descriptor: undefined,
    },
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
            case TRADING_COMMON.SET_TRADING_FROM_PREFILLED_ACCOUNT:
                draft.prefilledFromAccount.cryptoId = action.preffiledFromAccount.cryptoId;
                draft.prefilledFromAccount.descriptor = action.preffiledFromAccount.descriptor;
                break;
            case TRADING_COMMON.SAVE_TRADE:
                if (action.key) {
                    const trades = state.trades.filter(t => t.key !== action.key);
                    const { type, ...trade } = action;
                    trades.push(trade);
                    draft.trades = trades;
                }
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

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

export const selectTradingSellInfo = createMemoizedSelector(
    [state => state.wallet.trading.sell],
    (sell): TradingSellInfoSelector | undefined => {
        const { sellInfo } = sell;

        if (!sellInfo) return;

        return {
            ...sellInfo,
            supportedCryptoCurrencies: new Set(sellInfo.supportedCryptoCurrencies),
            supportedFiatCurrencies: new Set(sellInfo.supportedFiatCurrencies),
        };
    },
);

export const selectSupportedSymbols =
    (type: TradingType) =>
    (state: AppState): Set<CryptoId> | undefined => {
        switch (type) {
            case 'buy':
                return selectTradingBuyInfo(state)?.supportedCryptoCurrencies;
            case 'exchange':
                return selectTradingExchangeInfo(state)?.sellCryptoIds;
            case 'sell':
                return selectTradingSellInfo(state)?.supportedCryptoCurrencies;
        }
    };
