import { useState } from 'react';

import { getWrappableNativeBalance } from '@suite-common/wallet-core';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldDepositFormValues,
    yieldDepositFormValidationSchema,
} from '../yieldDepositFormSchema';

type UseWrapNativeTokenFormParams = {
    availableBalance: string;
    decimals: number;
    tokenSymbol: string;
};

export const useWrapNativeTokenForm = ({
    availableBalance,
    decimals,
    tokenSymbol,
}: UseWrapNativeTokenFormParams) => {
    const { translate } = useTranslate();
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    // Max leaves the gas reserve aside; the field still accepts up to the full balance and eating
    // into the reserve only triggers a non-blocking recommendation.
    const maxWrapAmount = getWrappableNativeBalance(availableBalance);

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
        form.setValue('amount', value ? maxWrapAmount : '', { shouldValidate: true });
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
