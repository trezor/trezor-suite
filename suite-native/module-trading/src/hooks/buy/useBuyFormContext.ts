import { useFormContext } from '@suite-native/forms';

import { TradingBuyFormValues } from '../../types';

export const useTradingBuyFormContext = () => useFormContext<TradingBuyFormValues>();
