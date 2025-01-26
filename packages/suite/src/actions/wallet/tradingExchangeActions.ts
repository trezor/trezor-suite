import {
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
    CryptoId,
} from 'invity-api';

import { invityAPI } from '@suite-common/invity';

import { Account } from 'src/types/wallet';
import { Dispatch } from 'src/types/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { verifyAddress as verifyExchangeAddress } from 'src/actions/wallet/trading/tradingCommonActions';

import { TRADING_EXCHANGE, TRADING_COMMON } from './constants';

export interface ExchangeInfo {
    exchangeList?: ExchangeListResponse;
    providerInfos: { [name: string]: ExchangeProviderInfo };
    buySymbols: Set<CryptoId>;
    sellSymbols: Set<CryptoId>;
}

export type TradingExchangeAction =
    | { type: typeof TRADING_EXCHANGE.SAVE_EXCHANGE_INFO; exchangeInfo: ExchangeInfo }
    | {
          type: typeof TRADING_EXCHANGE.SAVE_QUOTE_REQUEST;
          request: ExchangeTradeQuoteRequest;
      }
    | { type: typeof TRADING_EXCHANGE.SAVE_TRANSACTION_ID; transactionId: string | undefined }
    | { type: typeof TRADING_EXCHANGE.SET_IS_FROM_REDIRECT; isFromRedirect: boolean }
    | { type: typeof TRADING_EXCHANGE.VERIFY_ADDRESS; addressVerified: string }
    | {
          type: typeof TRADING_EXCHANGE.SAVE_QUOTES;
          quotes: ExchangeTrade[];
      }
    | {
          type: typeof TRADING_EXCHANGE.SAVE_QUOTE;
          quote: ExchangeTrade | undefined;
      }
    | { type: typeof TRADING_EXCHANGE.SET_TRADING_ACCOUNT; account: Account | undefined }
    | {
          type: typeof TRADING_COMMON.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'exchange';
          data: ExchangeTrade;
          account: {
              symbol: Account['symbol'];
              descriptor: Account['descriptor'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
          };
      };

export const loadExchangeInfo = async (): Promise<ExchangeInfo> => {
    const exchangeList = await invityAPI.getExchangeList();

    if (!exchangeList || exchangeList.length === 0) {
        return { providerInfos: {}, buySymbols: new Set(), sellSymbols: new Set() };
    }

    const providerInfos: { [name: string]: ExchangeProviderInfo } = {};
    exchangeList.forEach(e => (providerInfos[e.name] = e));

    // merge symbols supported by at least one partner
    const buySymbolsArray: CryptoId[] = [];
    const sellSymbolsArray: CryptoId[] = [];
    exchangeList.forEach(p => {
        if (p.buyTickers) {
            buySymbolsArray.push(...p.buyTickers);
        }
        if (p.sellTickers) {
            sellSymbolsArray.push(...p.sellTickers);
        }
    });

    const buySymbols = new Set<CryptoId>(buySymbolsArray);
    const sellSymbols = new Set<CryptoId>(sellSymbolsArray);

    return {
        exchangeList,
        providerInfos,
        buySymbols,
        sellSymbols,
    };
};

export const saveExchangeInfo = (exchangeInfo: ExchangeInfo): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SAVE_EXCHANGE_INFO,
    exchangeInfo,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useTradingExchangeOffers
export const openTradingExchangeConfirmModal =
    (provider?: string, isDex?: boolean, fromCryptoCurrency?: string, toCryptoCurrency?: string) =>
    (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: isDex ? 'trading-exchange-dex-terms' : 'trading-exchange-terms',
                provider,
                fromCryptoCurrency,
                toCryptoCurrency,
            }),
        );

export const saveTrade = (
    exchangeTrade: ExchangeTrade,
    account: Account,
    date: string,
): TradingExchangeAction => ({
    type: TRADING_COMMON.SAVE_TRADE,
    tradeType: 'exchange',
    key: exchangeTrade.orderId,
    date,
    data: exchangeTrade,
    account: {
        descriptor: account.descriptor,
        symbol: account.symbol,
        accountType: account.accountType,
        accountIndex: account.index,
    },
});

export const saveQuoteRequest = (request: ExchangeTradeQuoteRequest): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionId = (transactionId: string | undefined): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SAVE_TRANSACTION_ID,
    transactionId,
});

export const saveQuotes = (quotes: ExchangeTrade[]): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SAVE_QUOTES,
    quotes,
});

export const saveSelectedQuote = (quote: ExchangeTrade | undefined): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SAVE_QUOTE,
    quote,
});

export const setIsFromRedirect = (isFromRedirect: boolean): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SET_IS_FROM_REDIRECT,
    isFromRedirect,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifyExchangeAddress(account, address, path, TRADING_EXCHANGE.VERIFY_ADDRESS);

export const setTradingExchangeAccount = (account: Account | undefined): TradingExchangeAction => ({
    type: TRADING_EXCHANGE.SET_TRADING_ACCOUNT,
    account,
});
