import { useEffect, useState } from 'react';

import { type YieldFlowToken } from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldDepositFormValues,
    yieldDepositFormValidationSchema,
} from '../yieldDepositFormSchema';

type UseYieldDepositFormParams = {
    defaultAmount?: string | null;
    token: YieldFlowToken | null;
    tokenSymbol: TokenSymbol | null;
};

export const useYieldDepositForm = ({
    defaultAmount,
    token,
    tokenSymbol,
}: UseYieldDepositFormParams) => {
    const { translate } = useTranslate();
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    const availableBalance = token?.balance ?? '0';

    const form = useForm<YieldDepositFormValues>({
        validation: yieldDepositFormValidationSchema,
        mode: 'onChange',
        context: {
            availableBalance,
            decimals: token?.decimals,
            tokenSymbol,
            translate,
        },
        defaultValues: { amount: defaultAmount ?? '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    useEffect(() => {
        if (defaultAmount) {
            void form.trigger('amount');
        }
    }, [defaultAmount, form]);

    const handleMaxChange = (value: boolean) => {
        setIsMaxSelected(value);
        form.setValue('amount', value ? availableBalance : '', { shouldValidate: true });
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
