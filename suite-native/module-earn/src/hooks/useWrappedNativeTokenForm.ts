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

    const watchedAmount = useWatch({ control: form.control, name: 'amount' });
    // A prefill dispatched from a child effect can fire before useWatch's subscription is
    // attached on device, freezing the watched value at the mount-time empty string. Falling
    // back to a direct store read heals that without watch()'s re-render-per-field cost.
    const amountValue = watchedAmount || form.getValues('amount');

    // Re-dispatch the missed update so every subscriber converges on the stored value. This
    // effect runs after useWatch's subscription effect above, so the notification is caught.
    useEffect(() => {
        const storedAmount = form.getValues('amount');

        if (!watchedAmount && storedAmount) {
            form.setValue('amount', storedAmount, { shouldValidate: true });
        }
    }, [watchedAmount, form]);

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
