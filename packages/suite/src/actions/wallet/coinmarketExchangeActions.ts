import { Account } from '@wallet-types';
import {
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
} from 'invity-api';
import invityAPI from '@suite/services/invityAPI';
import { COINMARKET_EXCHANGE } from './constants';
import { Dispatch } from '@suite-types';

export interface ExchangeInfo {
    exchangeList?: ExchangeListResponse;
    providerInfos: { [name: string]: ExchangeProviderInfo };
    buySymbols: Set<string>;
    sellSymbols: Set<string>;
}

export type CoinmarketExchangeActions =
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
              symbol: Account['symbol'];
              accountIndex: Account['index'];
              accountType: Account['accountType'];
              deviceState: Account['deviceState'];
          };
      };

export async function loadExchangeInfo(): Promise<ExchangeInfo> {
    const exchangeList = await invityAPI.getExchangeList();

    if (!exchangeList || exchangeList.length === 0) {
        return { providerInfos: {}, buySymbols: new Set(), sellSymbols: new Set() };
    }

    const providerInfos: { [name: string]: ExchangeProviderInfo } = {};
    exchangeList.forEach(e => (providerInfos[e.name] = e));

    const buySymbols: string[] = [];
    const sellSymbols: string[] = [];
    exchangeList.forEach(p => {
        buySymbols.push(...p.buyTickers.map(c => c.toLowerCase()));
        sellSymbols.push(...p.sellTickers.map(c => c.toLowerCase()));
    });

    return {
        exchangeList,
        providerInfos,
        buySymbols: new Set(buySymbols),
        sellSymbols: new Set(sellSymbols),
    };
}

export const saveExchangeInfo = (exchangeInfo: ExchangeInfo) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO,
        exchangeInfo,
    });
};

export const saveTrade = (exchangeTrade: ExchangeTrade, account: Account, date: string) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_EXCHANGE.SAVE_TRADE,
        tradeType: 'exchange',
        key: exchangeTrade.orderId,
        date,
        data: exchangeTrade,
        account: {
            deviceState: account.deviceState,
            symbol: account.symbol,
            accountType: account.accountType,
            accountIndex: account.index,
        },
    });
};

export const saveQuoteRequest = (request: ExchangeTradeQuoteRequest) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST,
        request,
    });
};

export const saveTransactionId = (transactionId: string) => async (dispatch: Dispatch) => {
    dispatch({
        type: COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID,
        transactionId,
    });
};

export const saveQuotes = (fixedQuotes: ExchangeTrade[], floatQuotes: ExchangeTrade[]) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: COINMARKET_EXCHANGE.SAVE_QUOTES,
        fixedQuotes,
        floatQuotes,
    });
};
