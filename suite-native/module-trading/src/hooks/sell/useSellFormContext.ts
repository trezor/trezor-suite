import { useFormContext } from '@suite-native/forms';

import { SellFormValues } from '../../types/sell';

export const useSellFormContext = () => useFormContext<SellFormValues>();
