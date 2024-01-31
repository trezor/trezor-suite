import { Account } from 'src/types/wallet';
import { Dispatch } from 'src/types/suite';
import {
    ExchangeListResponse,
    ExchangeProviderInfo,
    ExchangeTradeQuoteRequest,
    ExchangeTrade,
    CryptoSymbol,
} from 'invity-api';
import invityAPI from 'src/services/suite/invityAPI';
import { COINMARKET_EXCHANGE, COINMARKET_COMMON } from './constants';
import * as modalActions from 'src/actions/suite/modalActions';
import { verifyAddress as verifyExchangeAddress } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';

export interface ExchangeInfo {
    exchangeList?: ExchangeListResponse;
    providerInfos: { [name: string]: ExchangeProviderInfo };
    buySymbols: Set<CryptoSymbol>;
    sellSymbols: Set<CryptoSymbol>;
}

export type CoinmarketExchangeAction =
    | { type: typeof COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO; exchangeInfo: ExchangeInfo }
    | { type: typeof COINMARKET_EXCHANGE.SAVE_QUOTE_REQUEST; request: ExchangeTradeQuoteRequest }
    | { type: typeof COINMARKET_EXCHANGE.SAVE_TRANSACTION_ID; transactionId: string }
    | { type: typeof COINMARKET_EXCHANGE.VERIFY_ADDRESS; addressVerified: string }
    | {
          type: typeof COINMARKET_EXCHANGE.SAVE_QUOTES;
          fixedQuotes: ExchangeTrade[];
          floatQuotes: ExchangeTrade[];
          dexQuotes: ExchangeTrade[];
      }
    | { type: typeof COINMARKET_EXCHANGE.CLEAR_QUOTES }
    | {
          type: typeof COINMARKET_COMMON.SAVE_TRADE;
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
    const buySymbolsArray: CryptoSymbol[] = [];
    const sellSymbolsArray: CryptoSymbol[] = [];
    exchangeList.forEach(p => {
        if (p.buyTickers) {
            buySymbolsArray.push(...p.buyTickers);
        }
        if (p.sellTickers) {
            sellSymbolsArray.push(...p.sellTickers);
        }
    });

    const buySymbols = new Set<CryptoSymbol>(buySymbolsArray);
    const sellSymbols = new Set<CryptoSymbol>(sellSymbolsArray);

    return {
        exchangeList,
        providerInfos,
        buySymbols,
        sellSymbols,
    };
};

export const saveExchangeInfo = (exchangeInfo: ExchangeInfo): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_EXCHANGE_INFO,
    exchangeInfo,
});

// this is only a wrapper for `openDeferredModal` since it doesn't work with `bindActionCreators`
// used in useCoinmarketExchangeOffers
export const openCoinmarketExchangeConfirmModal =
    (provider?: string, isDex?: boolean, fromCryptoCurrency?: string, toCryptoCurrency?: string) =>
    (dispatch: Dispatch) =>
        dispatch(
            modalActions.openDeferredModal({
                type: isDex ? 'coinmarket-exchange-dex-terms' : 'coinmarket-exchange-terms',
                provider,
                fromCryptoCurrency,
                toCryptoCurrency,
            }),
        );

export const saveTrade = (
    exchangeTrade: ExchangeTrade,
    account: Account,
    date: string,
): CoinmarketExchangeAction => ({
    type: COINMARKET_COMMON.SAVE_TRADE,
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
    dexQuotes: ExchangeTrade[],
): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.SAVE_QUOTES,
    fixedQuotes,
    floatQuotes,
    dexQuotes,
});

export const clearQuotes = (): CoinmarketExchangeAction => ({
    type: COINMARKET_EXCHANGE.CLEAR_QUOTES,
});

export const verifyAddress = (account: Account, address?: string, path?: string) =>
    verifyExchangeAddress(account, address, path, COINMARKET_EXCHANGE.VERIFY_ADDRESS);
