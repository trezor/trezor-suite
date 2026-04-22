import { useState } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldSupplyFormValues,
    yieldSupplyFormValidationSchema,
} from '../yieldSupplyFormSchema';

type AccountToken = NonNullable<Account['tokens']>[number];

type UseYieldSupplyFormParams = {
    token: AccountToken | null;
    tokenSymbol: string;
};

export const useYieldSupplyForm = ({ token, tokenSymbol }: UseYieldSupplyFormParams) => {
    const { translate } = useTranslate();
    const [isMaxSelected, setIsMaxSelected] = useState(false);

    const availableBalance = token?.balance ?? '0';

    const form = useForm<YieldSupplyFormValues>({
        validation: yieldSupplyFormValidationSchema,
        mode: 'onChange',
        context: {
            availableBalance,
            decimals: token?.decimals,
            tokenSymbol,
            translate,
        },
        defaultValues: { amount: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

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
