import type { FormResponse } from 'invity-api';

import { TradingBuyType, TradingType } from '@suite-common/trading';

export type BrowserAuthProps =
    | {
          tradingType: TradingType | undefined;
          orderId?: undefined;
      }
    // We need orderId for buy flow only. It is used to open trade in history after successful provider confirmation.
    | {
          tradingType: TradingBuyType;
          orderId: string;
      };

export type BrowserAuthRet = {
    openBrowser: (url: string, callbackUrl: string) => Promise<void> | void;
    openBrowserForFormData: (formData: FormResponse['form'], returnUrl: string) => void;
};
