import { Account } from '@wallet-types';
import { BuyListResponse, BuyProviderInfo, BuyTradeQuoteRequest, BuyTrade } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import { COINMARKET_BUY, COINMARKET_COMMON } from './constants';
import { Dispatch } from '@suite-types';
import regional from '@wallet-constants/coinmarket/regional';
import * as modalActions from '@suite-actions/modalActions';

export interface BuyInfo {
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
}

export type CoinmarketBuyAction =
    | { type: typeof COINMARKET_BUY.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof COINMARKET_BUY.DISPOSE }
    | { type: typeof COINMARKET_BUY.SET_IS_FROM_REDIRECT; isFromRedirect: boolean }
    | { type: typeof COINMARKET_BUY.SAVE_TRANSACTION_DETAIL_ID; transactionId: string }
    | { type: typeof COINMARKET_BUY.SAVE_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | { type: typeof COINMARKET_BUY.VERIFY_ADDRESS; addressVerified: string }
    | {
          type: typeof COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO;
          symbol: Account['symbol'];
          index: Account['index'];
          accountType: Account['accountType'];
          shouldSubmit?: boolean;
      }
    | {
          type: typeof COINMARKET_BUY.SAVE_QUOTES;
          quotes: BuyTrade[];
          alternativeQuotes: BuyTrade[];
      }
    | { type: typeof COINMARKET_BUY.CLEAR_QUOTES }
    | {
          type: typeof COINMARKET_COMMON.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'buy';
          data: BuyTrade;
          account: {
              symbol: Account['symbol'];
              descriptor: Account['descriptor'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
          };
      };

export const loadBuyInfo = async (): Promise<BuyInfo> => {
    let buyInfo = await invityAPI.getBuyList();

    if (!buyInfo) {
        buyInfo = { country: regional.unknownCountry, providers: [] };
    }

    if (!buyInfo.providers) {
        buyInfo.providers = [];
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    const tradedFiatCurrencies: string[] = [];
    const tradedCoins: string[] = [];
    buyInfo.providers.forEach(p => {
        tradedFiatCurrencies.push(...p.tradedFiatCurrencies.map(c => c.toLowerCase()));
        tradedCoins.push(...p.tradedCoins.map(c => c.toLowerCase()));
    });
    const supportedFiatCurrencies = new Set(tradedFiatCurrencies);
    const supportedCryptoCurrencies = new Set(tradedCoins);

    return {
        buyInfo,
        providerInfos,
        supportedFiatCurrencies,
        supportedCryptoCurrencies,
    };
};

export const saveBuyInfo = (buyInfo: BuyInfo): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_BUY_INFO,
    buyInfo,
});

export const dispose = (): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.DISPOSE,
});

export const setIsFromRedirect = (isFromRedirect: boolean): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SET_IS_FROM_REDIRECT,
    isFromRedirect,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useCoinmarketBuyOffers
export const openCoinmarketBuyConfirmModal = (provider?: string) => (dispatch: Dispatch) =>
    dispatch(modalActions.openDeferredModal({ type: 'coinmarket-buy-terms', provider }));

export const saveTrade = (
    buyTrade: BuyTrade,
    account: Account,
    date: string,
): CoinmarketBuyAction => ({
    type: COINMARKET_COMMON.SAVE_TRADE,
    tradeType: 'buy',
    key: buyTrade.paymentId,
    date,
    data: buyTrade,
    account: {
        descriptor: account.descriptor,
        symbol: account.symbol,
        accountType: account.accountType,
        accountIndex: account.index,
    },
});

export const saveQuoteRequest = (request: BuyTradeQuoteRequest): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionDetailId = (transactionId: string): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_TRANSACTION_DETAIL_ID,
    transactionId,
});

export const saveCachedAccountInfo = (
    symbol: Account['symbol'],
    index: number,
    accountType: Account['accountType'],
    shouldSubmit = false,
): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO,
    symbol,
    index,
    accountType,
    shouldSubmit,
});

export const saveQuotes = (
    quotes: BuyTrade[],
    alternativeQuotes: BuyTrade[],
): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_QUOTES,
    quotes,
    alternativeQuotes,
});

export const clearQuotes = (): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.CLEAR_QUOTES,
});
