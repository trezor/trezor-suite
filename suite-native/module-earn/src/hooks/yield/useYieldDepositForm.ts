import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type YieldFlowToken,
    getYieldDepositAvailableBalance,
    selectBaseCurrency,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import {
    type YieldDepositFormValues,
    yieldDepositFormValidationSchema,
} from '../../utils/yield/yieldDepositFormSchema';
import { getFiatFormValue, getYieldTokenContract } from '../../utils/yield/yieldFiatAmountUtils';

type UseYieldDepositFormParams = {
    defaultAmount?: string | null;
    token: YieldFlowToken | null;
    tokenSymbol: TokenSymbol | null;
    wrappedAmount?: string | null;
};

export const useYieldDepositForm = ({
    defaultAmount,
    token,
    tokenSymbol,
    wrappedAmount,
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

    const availableBalance = getYieldDepositAvailableBalance({
        tokenBalance: token?.balance,
        wrappedAmount,
    });

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

    // The wrapped-token balance can land after the screen mounted, when the prefilled amount was
    // already validated against the stale one — re-run validation so it clears.
    useEffect(() => {
        if (!form.getValues('amount')) {
            return;
        }

        void form.trigger('amount');
    }, [availableBalance, defaultAmount, form]);

    const handleMaxPress = () => {
        form.setValue('amount', availableBalance, { shouldValidate: true });
        form.setValue('fiat', getFiatValue(availableBalance));
    };

    return {
        amountValue,
        availableBalance,
        form,
        handleMaxPress,
    };
};
