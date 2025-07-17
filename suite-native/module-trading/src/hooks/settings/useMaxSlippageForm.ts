import { useSelector } from 'react-redux';

import { useForm } from '@suite-native/forms';

import { selectExchangeMaxSlippage } from '../../selectors/exchangeSelectors';
import { MaxSlippageFormType, MaxSlippageFormValues } from '../../types/settings';
import { maxSlippageFormValidationSchema } from '../../utils/settings/maxSlippageFormValidationSchema';

export const useMaxSlippageForm = (): MaxSlippageFormType => {
    const defaultMaxSlippage = useSelector(selectExchangeMaxSlippage);

    return useForm<MaxSlippageFormValues>({
        defaultValues: {
            maxSlippage: defaultMaxSlippage,
        },
        validation: maxSlippageFormValidationSchema,
    });
};
