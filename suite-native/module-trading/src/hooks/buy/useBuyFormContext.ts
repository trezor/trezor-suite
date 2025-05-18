import { useFormContext } from '@suite-native/forms';

import { TradingBuyFormValues } from '../../types';

export const useBuyFormContext = () => useFormContext<TradingBuyFormValues>();
