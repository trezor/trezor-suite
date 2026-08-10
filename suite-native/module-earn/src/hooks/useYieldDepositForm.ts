import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type YieldFlowToken,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { getFiatFormValue, getYieldTokenContract } from '../utils/yieldFiatAmountUtils';
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

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });
    const converters = useCryptoFiatConverters({
        symbol: token?.networkSymbol ?? null,
        tokenContract: getYieldTokenContract(token),
    });

    const availableBalance = token?.balance ?? '0';

    const getFiatValue = (cryptoAmount: string) =>
        getFiatFormValue({
            cryptoAmount,
            convertCryptoToFiat: converters?.convertCryptoToFiat,
            decimals: baseCurrencyDecimals,
        });

    const form = useForm<YieldDepositFormValues>({
        validation: yieldDepositFormValidationSchema,
        mode: 'onChange',
        context: {
            availableBalance,
            decimals: token?.decimals,
            tokenSymbol,
            translate,
        },
        defaultValues: { amount: defaultAmount ?? '', fiat: getFiatValue(defaultAmount ?? '') },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    useEffect(() => {
        if (defaultAmount) {
            void form.trigger('amount');
        }
    }, [defaultAmount, form]);

    const handleMaxPress = () => {
        form.setValue('amount', availableBalance, { shouldValidate: true });
        form.setValue('fiat', getFiatValue(availableBalance));
    };

    return {
        amountValue,
        form,
        handleMaxPress,
    };
};
