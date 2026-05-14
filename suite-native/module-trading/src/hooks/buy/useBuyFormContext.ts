import { useFormContext } from '@suite-native/forms';
import { type BuyFormValues } from '@suite-native/trading-types';

export const useBuyFormContext = () => useFormContext<BuyFormValues>();
