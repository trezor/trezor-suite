import {
    BuyListResponse,
    BuyProviderInfo,
    BuyTrade,
    BuyTradeQuoteRequest,
    CryptoId,
    FiatCurrencyCode,
} from 'invity-api';

import { invityAPI, regional } from '@suite-common/trading';

import * as modalActions from 'src/actions/suite/modalActions';
import { verifyAddress as verifyBuyAddress } from 'src/actions/wallet/trading/tradingCommonActions';
import { Dispatch } from 'src/types/suite';
import { TradingFiatCurrenciesProps } from 'src/types/trading/trading';
import { Account } from 'src/types/wallet';

import { TRADING_BUY, TRADING_COMMON } from './constants';

export interface BuyInfo {
    buyInfo: Omit<BuyListResponse, 'defaultAmountsOfFiatCurrencies'> & {
        defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps;
    };
    providerInfos: { [name: string]: BuyProviderInfo };
    supportedFiatCurrencies: Set<string>;
    supportedCryptoCurrencies: Set<CryptoId>;
}

export type TradingBuyAction =
    | { type: typeof TRADING_BUY.SAVE_BUY_INFO; buyInfo: BuyInfo }
    | { type: typeof TRADING_BUY.DISPOSE }
    | { type: typeof TRADING_BUY.SET_IS_FROM_REDIRECT; isFromRedirect: boolean }
    | { type: typeof TRADING_BUY.SAVE_TRANSACTION_DETAIL_ID; transactionId: string }
    | { type: typeof TRADING_BUY.SAVE_QUOTE_REQUEST; request: BuyTradeQuoteRequest }
    | { type: typeof TRADING_BUY.VERIFY_ADDRESS; addressVerified: string | undefined }
    | {
          type: typeof TRADING_BUY.SAVE_QUOTES;
          quotes: BuyTrade[];
      }
    | { type: typeof TRADING_BUY.SAVE_QUOTE; quote: BuyTrade | undefined }
    | { type: typeof TRADING_BUY.CLEAR_QUOTES }
    | {
          type: typeof TRADING_COMMON.SAVE_TRADE;
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
    const defaultAmountsOfFiatCurrencies: TradingFiatCurrenciesProps = new Map();

    if (!buyInfo || !buyInfo.providers) {
        return {
            buyInfo: {
                country: regional.UNKNOWN_COUNTRY,
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

export const saveBuyInfo = (buyInfo: BuyInfo): TradingBuyAction => ({
    type: TRADING_BUY.SAVE_BUY_INFO,
    buyInfo,
});

export const dispose = (): TradingBuyAction => ({
    type: TRADING_BUY.DISPOSE,
});

export const setIsFromRedirect = (isFromRedirect: boolean): TradingBuyAction => ({
    type: TRADING_BUY.SET_IS_FROM_REDIRECT,
    isFromRedirect,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useTradingBuyForm
export const openTradingBuyConfirmModal =
    (provider?: string, cryptoCurrency?: string) => (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: 'trading-buy-terms',
                provider,
                cryptoCurrency,
            }),
        );

export const saveTrade = (
    buyTrade: BuyTrade,
    account: Account,
    date: string,
): TradingBuyAction => ({
    type: TRADING_COMMON.SAVE_TRADE,
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

export const saveQuoteRequest = (request: BuyTradeQuoteRequest): TradingBuyAction => ({
    type: TRADING_BUY.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionDetailId = (transactionId: string): TradingBuyAction => ({
    type: TRADING_BUY.SAVE_TRANSACTION_DETAIL_ID,
    transactionId,
});

export const saveQuotes = (quotes: BuyTrade[]): TradingBuyAction => ({
    type: TRADING_BUY.SAVE_QUOTES,
    quotes,
});

export const saveSelectedQuote = (quote: BuyTrade | undefined): TradingBuyAction => ({
    type: TRADING_BUY.SAVE_QUOTE,
    quote,
});

export const clearQuotes = (): TradingBuyAction => ({
    type: TRADING_BUY.CLEAR_QUOTES,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifyBuyAddress(account, address, path, TRADING_BUY.VERIFY_ADDRESS);
