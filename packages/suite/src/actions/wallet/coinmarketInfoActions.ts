import { CryptoSymbolInfo } from 'invity-api';
import { COINMARKET_INFO } from 'src/actions/wallet/constants';
import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';

export type CoinmarketInfoAction =
    | {
          type: typeof COINMARKET_INFO.SAVE_SYMBOLS_INFO;
          symbolsInfo: CryptoSymbolInfo[];
      }
    | {
          type: typeof COINMARKET_INFO.SAVE_PAYMENT_METHODS;
          paymentMethods: CoinmarketPaymentMethodListProps[];
      };

export const loadSymbolsInfo = async (): Promise<CryptoSymbolInfo[]> => {
    const symbolsInfo = await invityAPI.getSymbolsInfo();

    if (!symbolsInfo || symbolsInfo.length === 0) {
        return [];
    }

    return symbolsInfo;
};

export const saveSymbolsInfo = (symbolsInfo: CryptoSymbolInfo[]): CoinmarketInfoAction => ({
    type: COINMARKET_INFO.SAVE_SYMBOLS_INFO,
    symbolsInfo,
});

export const savePaymentMethods = (
    paymentMethods: CoinmarketPaymentMethodListProps[],
): CoinmarketInfoAction => ({
    type: COINMARKET_INFO.SAVE_PAYMENT_METHODS,
    paymentMethods,
});
