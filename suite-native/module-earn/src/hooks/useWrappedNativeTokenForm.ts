import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldDepositFormValues,
    yieldDepositFormValidationSchema,
} from '../yieldDepositFormSchema';

type UseWrappedNativeTokenFormParams = {
    availableBalance: string;
    decimals: number;
    tokenSymbol: string;
};

export const useWrappedNativeTokenForm = ({
    availableBalance,
    decimals,
    tokenSymbol,
}: UseWrappedNativeTokenFormParams) => {
    const { translate } = useTranslate();

    const form = useForm<YieldDepositFormValues>({
        validation: yieldDepositFormValidationSchema,
        mode: 'onChange',
        context: {
            availableBalance,
            decimals,
            tokenSymbol,
            translate,
        },
        defaultValues: { amount: '', fiat: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    return {
        amountValue,
        form,
    };
};
