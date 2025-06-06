import { useForm } from '@suite-native/forms';

import { ExchangeFormValues } from '../../types/exchange';
import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';

export const useExchangeForm = () => {
    const form = useForm<ExchangeFormValues>({
        validation: exchangeFormValidationSchema,
    });

    return form;
};
