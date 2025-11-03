import { useFormContext } from '@suite-native/forms';
import { SellFormValues } from '@suite-native/trading-types';

export const useSellFormContext = () => useFormContext<SellFormValues>();
