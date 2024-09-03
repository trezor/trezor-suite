import { InfoResponse } from 'invity-api';
import { COINMARKET_INFO } from 'src/actions/wallet/constants';
import { CoinmarketPaymentMethodListProps } from 'src/types/coinmarket/coinmarket';

export type CoinmarketInfoAction =
    | {
          type: typeof COINMARKET_INFO.SAVE_INFO;
          info: InfoResponse;
      }
    | {
          type: typeof COINMARKET_INFO.SAVE_PAYMENT_METHODS;
          paymentMethods: CoinmarketPaymentMethodListProps[];
      };

export const saveInfo = (info: InfoResponse): CoinmarketInfoAction => ({
    type: COINMARKET_INFO.SAVE_INFO,
    info,
});

export const savePaymentMethods = (
    paymentMethods: CoinmarketPaymentMethodListProps[],
): CoinmarketInfoAction => ({
    type: COINMARKET_INFO.SAVE_PAYMENT_METHODS,
    paymentMethods,
});
