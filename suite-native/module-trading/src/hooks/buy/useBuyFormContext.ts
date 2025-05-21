import { useFormContext } from '@suite-native/forms';

import { BuyFormValues } from '../../types/buy';

export const useBuyFormContext = () => useFormContext<BuyFormValues>();
