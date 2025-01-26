import {
    CryptoId,
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
    SellListResponse,
    SellProviderInfo,
} from 'invity-api';

import { invityAPI } from '@suite-common/invity';

import { Account } from 'src/types/wallet';
import { Dispatch } from 'src/types/suite';
import * as modalActions from 'src/actions/suite/modalActions';

import { TRADING_COMMON, TRADING_SELL } from './constants';

export interface SellInfo {
    sellList?: SellListResponse;
    providerInfos: { [name: string]: SellProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<CryptoId>;
}

export type TradingSellAction =
    | { type: typeof TRADING_SELL.SAVE_SELL_INFO; sellInfo: SellInfo }
    | { type: typeof TRADING_SELL.SAVE_QUOTE_REQUEST; request: SellFiatTradeQuoteRequest }
    | { type: typeof TRADING_SELL.SAVE_TRANSACTION_ID; transactionId?: string }
    | { type: typeof TRADING_SELL.SET_IS_FROM_REDIRECT; isFromRedirect: boolean }
    | { type: typeof TRADING_SELL.SET_TRADING_ACCOUNT; account: Account | undefined }
    | {
          type: typeof TRADING_SELL.SAVE_QUOTES;
          quotes: SellFiatTrade[];
      }
    | {
          type: typeof TRADING_SELL.SAVE_QUOTE;
          quote: SellFiatTrade | undefined;
      }
    | {
          type: typeof TRADING_COMMON.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'sell';
          data: SellFiatTrade;
          account: {
              symbol: Account['symbol'];
              descriptor: Account['descriptor'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
          };
      };

export const loadSellInfo = async (): Promise<SellInfo> => {
    const sellList = await invityAPI.getSellList();

    const providerInfos: { [name: string]: SellProviderInfo } = {};
    if (sellList?.providers) {
        sellList.providers.forEach(provider => (providerInfos[provider.name] = provider));
    }

    const supportedFiatCurrencies = new Set<string>();
    const supportedCryptoCurrencies = new Set<CryptoId>();
    sellList?.providers.forEach(p => {
        if (p.tradedFiatCurrencies) {
            p.tradedFiatCurrencies
                .map(currency => currency.toLowerCase())
                .forEach(currency => supportedFiatCurrencies.add(currency));
        }
        p.tradedCoins.forEach(coin => supportedCryptoCurrencies.add(coin));
    });

    return {
        sellList,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
    };
};

export const saveSellInfo = (sellInfo: SellInfo): TradingSellAction => ({
    type: TRADING_SELL.SAVE_SELL_INFO,
    sellInfo,
});

export const saveTrade = (
    exchangeTrade: SellFiatTrade,
    account: Account,
    date: string,
): TradingSellAction => ({
    type: TRADING_COMMON.SAVE_TRADE,
    tradeType: 'sell',
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

export const saveQuoteRequest = (request: SellFiatTradeQuoteRequest): TradingSellAction => ({
    type: TRADING_SELL.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionId = (transactionId?: string): TradingSellAction => ({
    type: TRADING_SELL.SAVE_TRANSACTION_ID,
    transactionId,
});

export const saveQuotes = (quotes: SellFiatTrade[]): TradingSellAction => ({
    type: TRADING_SELL.SAVE_QUOTES,
    quotes,
});

export const saveSelectedQuote = (quote: SellFiatTrade | undefined): TradingSellAction => ({
    type: TRADING_SELL.SAVE_QUOTE,
    quote,
});

export const setIsFromRedirect = (isFromRedirect: boolean): TradingSellAction => ({
    type: TRADING_SELL.SET_IS_FROM_REDIRECT,
    isFromRedirect,
});

export const setTradingSellAccount = (account: Account | undefined): TradingSellAction => ({
    type: TRADING_SELL.SET_TRADING_ACCOUNT,
    account,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useTradingSellOffers
export const openTradingSellConfirmModal =
    (provider?: string, cryptoCurrency?: string) => (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: 'trading-sell-terms',
                provider,
                cryptoCurrency,
            }),
        );
