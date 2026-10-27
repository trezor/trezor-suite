import { useEffect, useRef } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectAccountNetworkSymbol,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getDecimalsForBaseCurrency,
    getFiatRateKey,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useWatch } from '@suite-native/forms';
import { BigNumber } from '@trezor/utils';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';

type UseSendAmountPrefillParams = {
    form: UseFormReturn<SendOutputsFormValues>;
    accountKey: AccountKey;
    recipientIndex: number;
};

type PendingPrefill = {
    amount: string;
    token: string | null | undefined;
};

type GetPrefillFiatAmountParams = {
    amount: string;
    convertCryptoToFiat: ((amount: BigNumber) => BaseCurrencyAmount | null) | undefined;
    rate: number | undefined;
    decimals: number;
};

const getPrefillFiatAmount = ({
    amount,
    convertCryptoToFiat,
    rate,
    decimals,
}: GetPrefillFiatAmountParams): string | null => {
    if (!amount) return '';
    if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return null;

    const fiat = convertCryptoToFiat?.(new BigNumber(amount));

    return fiat?.isFinite() ? fiat.toFixed(decimals) : null;
};

export const useSendAmountPrefill = ({
    form: { control, getValues, setValue, subscribe },
    accountKey,
    recipientIndex,
}: UseSendAmountPrefillParams) => {
    const amountField = getOutputFieldName(recipientIndex, 'amount');
    const fiatField = getOutputFieldName(recipientIndex, 'fiat');
    const tokenField = getOutputFieldName(recipientIndex, 'token');
    const token = useWatch({ control, name: tokenField });
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const baseCurrency = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const tokenContract = token ? toTokenAddress(token) : undefined;
    const converters = useCryptoFiatConverters({ symbol, tokenContract });
    const rate = useSelector((state: FiatRatesRootState) =>
        symbol
            ? selectFiatRatesByFiatRateKey(
                  state,
                  getFiatRateKey(symbol, baseCurrency, tokenContract),
              )
            : undefined,
    );
    const decimals = getDecimalsForBaseCurrency({
        code: baseCurrency,
        isInSats: isBaseCurrencyInSats,
    });
    const pendingPrefill = useRef<PendingPrefill | null>(null);

    useEffect(() => {
        // Cancel synchronously, including edits that end at the original value before a rate arrives.
        const unsubscribe = subscribe({
            name: [amountField, fiatField, tokenField, 'outputs', 'setMaxOutputId'],
            exact: true,
            formState: { values: true },
            callback: ({ name, values }) => {
                if (name !== 'setMaxOutputId' || values.setMaxOutputId === recipientIndex) {
                    pendingPrefill.current = null;
                }
            },
        });

        return () => {
            unsubscribe();
            pendingPrefill.current = null;
        };
    }, [subscribe, amountField, fiatField, tokenField, recipientIndex, accountKey, isAmountInSats]);

    useEffect(() => {
        const pending = pendingPrefill.current;
        if (!pending) return;

        if (pending.token !== token) return;

        const fiat = getPrefillFiatAmount({
            amount: pending.amount,
            convertCryptoToFiat: converters?.convertCryptoToFiat,
            rate: rate?.rate,
            decimals,
        });
        if (fiat === null) return;

        pendingPrefill.current = null;
        setValue(fiatField, fiat);
    }, [converters, rate, decimals, fiatField, setValue, token]);

    const prefillAmount = (amount: string) => {
        pendingPrefill.current = null;
        const displayAmount =
            amount && isAmountInSats && symbol
                ? unitsToSubunits({ value: asAmountUnit(new BigNumber(amount)), symbol }).toString()
                : amount;
        setValue(amountField, displayAmount, { shouldValidate: true });

        const currentToken = getValues(tokenField);
        // A QR can change the token before its converter has re-rendered.
        const fiat =
            currentToken === token
                ? getPrefillFiatAmount({
                      amount: displayAmount,
                      convertCryptoToFiat: converters?.convertCryptoToFiat,
                      rate: rate?.rate,
                      decimals,
                  })
                : null;
        setValue(fiatField, fiat ?? '');

        if (fiat === null) {
            pendingPrefill.current = { amount: displayAmount, token: currentToken };
        }
    };

    return prefillAmount;
};
