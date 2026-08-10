import { useEffect } from 'react';

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

    // A prefilled amount can be validated from a child effect before this render's validation
    // context has reached the resolver, freezing an isValid verdict computed against a stale
    // balance. Re-validate here, after the form's own effects, whenever the inputs change.
    useEffect(() => {
        if (!amountValue) {
            return;
        }

        void form.trigger('amount');
    }, [amountValue, availableBalance, decimals, form]);

    return {
        amountValue,
        form,
    };
};
