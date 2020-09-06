import { Account } from '@wallet-types';
import { BuyListResponse, BuyProviderInfo, BuyTradeQuoteRequest, BuyTrade } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import { COINMARKET_BUY } from './constants';
import { Dispatch } from '@suite-types';
import regional from '@wallet-constants/coinmarket/regional';

export interface BuyInfo {
    buyInfo?: BuyListResponse;
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<string>;
}

export type CoinmarketBuyActions =
    | { type: typeof COINMARKET_BUY.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof COINMARKET_BUY.SAVE_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | { type: typeof COINMARKET_BUY.VERIFY_ADDRESS; addressVerified: boolean }
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
          alternativeQuotes: BuyTrade[] | undefined;
      }
    | {
          type: typeof COINMARKET_BUY.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'buy';
          data: BuyTrade;
          account: {
              symbol: Account['symbol'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
              deviceState: Account['deviceState'];
          };
      };

export async function loadBuyInfo(): Promise<BuyInfo> {
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
}

export const saveBuyInfo = (buyInfo: BuyInfo) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_BUY_INFO,
        buyInfo,
    });
};

export const saveTrade = (buyTrade: BuyTrade, account: Account, date: string) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_TRADE,
        tradeType: 'buy',
        key: buyTrade.paymentId,
        date,
        data: buyTrade,
        account: {
            deviceState: account.deviceState,
            symbol: account.symbol,
            accountType: account.accountType,
            accountIndex: account.index,
        },
    });
};

export const saveQuoteRequest = (request: BuyTradeQuoteRequest) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_QUOTE_REQUEST,
        request,
    });
};

export const saveCachedAccountInfo = (
    symbol: Account['symbol'],
    index: string,
    accountType: Account['accountType'],
    shouldSubmit = false,
) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_CACHED_ACCOUNT_INFO,
        symbol,
        index: parseInt(index, 10),
        accountType,
        shouldSubmit,
    });
};

export const saveQuotes = (quotes: BuyTrade[], alternativeQuotes: BuyTrade[] | undefined) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_BUY.SAVE_QUOTES,
        quotes,
        alternativeQuotes,
    });
};
