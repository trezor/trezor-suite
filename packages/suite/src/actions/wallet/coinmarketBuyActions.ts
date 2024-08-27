import { Account } from 'src/types/wallet';
import {
    BuyListResponse,
    BuyProviderInfo,
    BuyTradeQuoteRequest,
    BuyTrade,
    CryptoId,
    FiatCurrencyCode,
} from 'invity-api';
import invityAPI from 'src/services/suite/invityAPI';
import { COINMARKET_BUY, COINMARKET_COMMON } from './constants';
import { Dispatch } from 'src/types/suite';
import regional from 'src/constants/wallet/coinmarket/regional';
import * as modalActions from 'src/actions/suite/modalActions';
import { verifyAddress as verifyBuyAddress } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { CoinmarketFiatCurrenciesProps } from 'src/types/coinmarket/coinmarket';

export interface BuyInfo {
    buyInfo: Omit<BuyListResponse, 'defaultAmountsOfFiatCurrencies'> & {
        defaultAmountsOfFiatCurrencies: CoinmarketFiatCurrenciesProps;
    };
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<CryptoId>;
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
      }
    | { type: typeof COINMARKET_BUY.SAVE_QUOTE; quote: BuyTrade | undefined }
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
    const buyInfo = await invityAPI.getBuyList();
    const defaultAmountsOfFiatCurrencies: CoinmarketFiatCurrenciesProps = new Map();

    if (!buyInfo || !buyInfo.providers) {
        return {
            buyInfo: {
                country: regional.unknownCountry,
                providers: [],
                defaultAmountsOfFiatCurrencies,
            },
            providerInfos: {},
            supportedFiatCurrencies: new Set(),
            supportedCryptoCurrencies: new Set(),
        };
    }

    const providerInfos: { [name: string]: BuyProviderInfo } = {};

    buyInfo.providers.forEach(e => (providerInfos[e.name] = e));

    const tradedFiatCurrencies: string[] = [];
    const tradedCoins: CryptoId[] = [];
    buyInfo.providers.forEach(p => {
        tradedFiatCurrencies.push(...p.tradedFiatCurrencies.map(c => c.toLowerCase()));
        tradedCoins.push(...p.tradedCoins);
    });
    const supportedFiatCurrencies = new Set(tradedFiatCurrencies);
    const supportedCryptoCurrencies = new Set(tradedCoins);

    if (buyInfo.defaultAmountsOfFiatCurrencies) {
        Object.entries(buyInfo.defaultAmountsOfFiatCurrencies).forEach(([key, value]) => {
            defaultAmountsOfFiatCurrencies.set(key as FiatCurrencyCode, value.toString());
        });
    }

    return {
        buyInfo: {
            ...buyInfo,
            defaultAmountsOfFiatCurrencies,
        },
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
// used in useCoinmarketBuyForm
export const openCoinmarketBuyConfirmModal =
    (provider?: string, cryptoCurrency?: string) => (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: 'coinmarket-buy-terms',
                provider,
                cryptoCurrency,
            }),
        );

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

export const saveQuotes = (quotes: BuyTrade[]): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_QUOTES,
    quotes,
});

export const saveSelectedQuote = (quote: BuyTrade | undefined): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.SAVE_QUOTE,
    quote,
});

export const clearQuotes = (): CoinmarketBuyAction => ({
    type: COINMARKET_BUY.CLEAR_QUOTES,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifyBuyAddress(account, address, path, COINMARKET_BUY.VERIFY_ADDRESS);
