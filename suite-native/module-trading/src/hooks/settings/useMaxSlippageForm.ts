import { useSelector } from 'react-redux';

import { selectTradingMaxSlippagePercentage } from '@suite-common/trading';
import { useForm } from '@suite-native/forms';
import { type MaxSlippageFormType, type MaxSlippageFormValues } from '@suite-native/trading-types';

import { maxSlippageFormValidationSchema } from '../../utils/settings/maxSlippageFormValidationSchema';

export const useMaxSlippageForm = (): MaxSlippageFormType => {
    const defaultMaxSlippage = useSelector(selectTradingMaxSlippagePercentage);

    return useForm<MaxSlippageFormValues>({
        defaultValues: {
            maxSlippage: defaultMaxSlippage,
        },
        validation: maxSlippageFormValidationSchema,
    });
};
