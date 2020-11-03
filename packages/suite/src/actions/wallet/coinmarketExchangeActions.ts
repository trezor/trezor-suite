import { Account } from '@wallet-types';
import {
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
} from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import { COINMARKET_EXCHANGE } from './constants';

export interface ExchangeInfo {
    exchangeList?: ExchangeListResponse;
    providerInfos: { [name: string]: ExchangeProviderInfo };
    buySymbols: Set<string>;
    sellSymbols: Set<string>;
}

export type CoinmarketExchangeAction =
    | { type: typeof COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO; exchangeInfo: ExchangeInfo }
    | { type: typeof COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST; request: ExchangeTradeQuoteRequest }
    | { type: typeof COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID; transactionId: string }
    | { type: typeof COINMARKET_EXCHANGE.VERIFY_ADDRESS; addressVerified: boolean }
    | {
          type: typeof COINMARKET_EXCHANGE.SAVE_QUOTES;
          fixedQuotes: ExchangeTrade[];
          floatQuotes: ExchangeTrade[];
      }
    | {
          type: typeof COINMARKET_EXCHANGE.SAVE_TRADE;
          date: string;
          key?: string;
          tradeType: 'exchange';
          data: ExchangeTrade;
          account: {
              descriptor: string;
              symbol: Account['symbol'];
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

    const buySymbols: string[] = [];
    const sellSymbols: string[] = [];
    exchangeList.forEach(p => {
        if (p.buyTickers) {
            buySymbols.push(...p.buyTickers.map(c => c.toLowerCase()));
        }
        if (p.sellTickers) {
            sellSymbols.push(...p.sellTickers.map(c => c.toLowerCase()));
        }
    });

    return {
        exchangeList,
        providerInfos,
        buySymbols: new Set(buySymbols),
        sellSymbols: new Set(sellSymbols),
    };
};

export const saveExchangeInfo = (exchangeInfo: ExchangeInfo): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO,
    exchangeInfo,
});

export const saveTrade = (
    exchangeTrade: ExchangeTrade,
    account: Account,
    date: string,
): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_TRADE,
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

export const saveQuoteRequest = (request: ExchangeTradeQuoteRequest): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST,
    request,
});

export const saveTransactionId = (transactionId: string): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID,
    transactionId,
});

export const saveQuotes = (
    fixedQuotes: ExchangeTrade[],
    floatQuotes: ExchangeTrade[],
): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_QUOTES,
    fixedQuotes,
    floatQuotes,
});
