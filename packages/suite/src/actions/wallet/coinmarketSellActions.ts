import { Account } from '@wallet-types';
import {
    SellFiatTrade,
    SellFiatTradeQuoteRequest,
    SellListResponse,
    SellProviderInfo,
} from 'invity-api';
import { Dispatch } from '@suite-types';
import * as modalActions from '@suite-actions/modalActions';
import invityAPI from '@suite-services/invityAPI';
import { COINMARKET_COMMON, COINMARKET_SELL } from './constants';

export interface SellInfo {
    sellList?: SellListResponse;
    providerInfos: { [name: string]: SellProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
}

export type CoinmarketSellAction =
    | { type: typeof COINMARKET_SELL.SAVE_SELL_INFO; sellInfo: SellInfo }
    | { type: typeof COINMARKET_SELL.SHOW_LEAVE_MODAL; showLeaveModal: boolean }
    | { type: typeof COINMARKET_SELL.SAVE_QUOTE_REQUEST; request: SellFiatTradeQuoteRequest }
    | { type: typeof COINMARKET_SELL.SAVE_TRANSACTION_ID; transactionId: string }
    | { type: typeof COINMARKET_SELL.SET_IS_FROM_REDIRECT; isFromRedirect: boolean }
    | {
          type: typeof COINMARKET_SELL.SAVE_QUOTES;
          quotes: SellFiatTrade[];
          alternativeQuotes: SellFiatTrade[];
      }
    | { type: typeof COINMARKET_SELL.CLEAR_QUOTES }
    | {
          type: typeof COINMARKET_COMMON.SAVE_TRADE;
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
        sellList.providers.forEach(e => (providerInfos[e.name] = e));
    }

    const supportedFiatCurrencies = new Set<string>();
    const supportedCryptoCurrencies = new Set<string>();
    sellList?.providers.forEach(p => {
        if (p.tradedFiatCurrencies) {
            p.tradedFiatCurrencies
                .map(c => c.toLowerCase())
                .forEach(c => supportedFiatCurrencies.add(c));
        }
        p.tradedCoins.map(c => c.toLowerCase()).forEach(c => supportedCryptoCurrencies.add(c));
    });

    return {
        sellList,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
    };
};

export const saveSellInfo = (sellInfo: SellInfo): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SAVE_SELL_INFO,
    sellInfo,
});

export const setShowLeaveModal = (showLeaveModal: boolean): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SHOW_LEAVE_MODAL,
    showLeaveModal,
});

export const saveTrade = (
    exchangeTrade: SellFiatTrade,
    account: Account,
    date: string,
): CoinmarketSellAction => ({
    type: COINMARKET_COMMON.SAVE_TRADE,
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

export const saveQuoteRequest = (request: SellFiatTradeQuoteRequest): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionId = (transactionId: string): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SAVE_TRANSACTION_ID,
    transactionId,
});

export const saveQuotes = (
    quotes: SellFiatTrade[],
    alternativeQuotes: SellFiatTrade[],
): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SAVE_QUOTES,
    quotes,
    alternativeQuotes,
});

export const clearQuotes = (): CoinmarketSellAction => ({
    type: COINMARKET_SELL.CLEAR_QUOTES,
});

export const setIsFromRedirect = (isFromRedirect: boolean): CoinmarketSellAction => ({
    type: COINMARKET_SELL.SET_IS_FROM_REDIRECT,
    isFromRedirect,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useCoinmarketSellOffers
export const openCoinmarketSellConfirmModal = (provider?: string) => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'coinmarket-sell-terms', provider }));
