import { useFormContext } from '@suite-native/forms';
import { BuyFormValues } from '@suite-native/trading-types';

export const useBuyFormContext = () => useFormContext<BuyFormValues>();
