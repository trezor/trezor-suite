import { InfoResponse } from 'invity-api';

import { TRADING_INFO } from 'src/actions/wallet/constants';
import { TradingPaymentMethodListProps } from 'src/types/trading/trading';

export type TradingInfoAction =
    | {
          type: typeof TRADING_INFO.SAVE_INFO;
          info: InfoResponse;
      }
    | {
          type: typeof TRADING_INFO.SAVE_PAYMENT_METHODS;
          paymentMethods: TradingPaymentMethodListProps[];
      };

export const saveInfo = (info: InfoResponse): TradingInfoAction => ({
    type: TRADING_INFO.SAVE_INFO,
    info,
});

export const savePaymentMethods = (
    paymentMethods: TradingPaymentMethodListProps[],
): TradingInfoAction => ({
    type: TRADING_INFO.SAVE_PAYMENT_METHODS,
    paymentMethods,
});
