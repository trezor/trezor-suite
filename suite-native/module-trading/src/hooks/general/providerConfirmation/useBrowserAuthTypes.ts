import { TradingBuyType, TradingType } from '@suite-common/trading';

export type BrowserAuthProps =
    | {
          tradingType: TradingType | undefined;
          orderId?: undefined;
      }
    | {
          tradingType: TradingBuyType;
          orderId: string;
      };

export type BrowserAuthRet = {
    openBrowser: (url: string, callbackUrl: string) => Promise<void> | void;
};
