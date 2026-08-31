import { useCallback, useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { useSelector } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    fromBaseCurrencyToCryptoUnit,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { type TronStakeFormValues } from './useTronStakeForm';

type UseTronAmountInputProps = {
    account: Account;
    methods: UseFormReturn<TronStakeFormValues>;
};

export const useTronAmountInput = ({ account, methods }: UseTronAmountInputProps) => {
    const [currency, setCurrency] = useState<'crypto' | 'fiat'>('crypto');

    const { setValue, clearErrors } = methods;

    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const fiatRateKey = getFiatRateKey(account.symbol, baseCurrencyCode);
    const { decimals } = getNetwork(account.symbol);

    const currentRate = useSelector(state =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey, 'current'),
    );

    const onCryptoAmountChange = useCallback(
        (cryptoAmount: string) => {
            clearErrors(['amount', 'fiatAmount']);

            setValue('amount', cryptoAmount, { shouldDirty: true, shouldValidate: true });

            if (currentRate?.rate) {
                const fiatValue = toFiatCurrency({
                    amount: cryptoAmount,
                    rate: currentRate.rate,
                })?.toFixed(2, BigNumber.ROUND_FLOOR);

                setValue('fiatAmount', fiatValue ?? '', { shouldDirty: true });
            }
        },
        [currentRate, setValue, clearErrors],
    );

    const onFiatAmountChange = useCallback(
        (fiatAmount: string) => {
            clearErrors(['amount', 'fiatAmount']);

            setValue('fiatAmount', fiatAmount, { shouldDirty: true, shouldValidate: true });

            if (currentRate?.rate) {
                const cryptoValue = fromBaseCurrencyToCryptoUnit({
                    fiatAmount,
                    rate: currentRate.rate,
                })?.toFixed(decimals);

                setValue('amount', cryptoValue ?? '', { shouldDirty: true, shouldValidate: true });
            }
        },
        [currentRate, decimals, setValue, clearErrors],
    );

    return {
        currency,
        setCurrency,
        onCryptoAmountChange,
        onFiatAmountChange,
        currentRate,
        baseCurrencyCode,
    };
};
