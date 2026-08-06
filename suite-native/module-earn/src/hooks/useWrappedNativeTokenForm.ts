import { useState } from 'react';

import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldDepositFormValues,
    yieldDepositFormValidationSchema,
} from '../yieldDepositFormSchema';

type UseWrappedNativeTokenFormParams = {
    availableBalance: string;
    decimals: number;
    maxAmount?: string;
    tokenSymbol: string;
};

export const useWrappedNativeTokenForm = ({
    availableBalance,
    decimals,
    maxAmount,
    tokenSymbol,
}: UseWrappedNativeTokenFormParams) => {
    const { translate } = useTranslate();
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    const form = useForm<YieldDepositFormValues>({
        validation: yieldDepositFormValidationSchema,
        mode: 'onChange',
        context: {
            availableBalance,
            decimals,
            tokenSymbol,
            translate,
        },
        defaultValues: { amount: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    const handleMaxChange = (value: boolean) => {
        setIsMaxSelected(value);
        form.setValue('amount', value ? (maxAmount ?? availableBalance) : '', {
            shouldValidate: true,
        });
    };

    const handleAmountChange = () => {
        if (isMaxSelected) {
            setIsMaxSelected(false);
        }
    };

    return {
        amountValue,
        form,
        isMaxSelected,
        handleAmountChange,
        handleMaxChange,
    };
};
