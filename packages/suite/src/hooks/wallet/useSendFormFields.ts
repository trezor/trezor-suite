import { useCallback } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import {
    amountToSmallestUnit,
    formatNetworkAmount,
    fromFiatCurrency,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { FormState, FormOptions, TokenAddress, Rate } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { TokenInfo } from '@trezor/blockchain-link-types';

import { SendContextValues, UseSendFormState } from 'src/types/wallet/sendForm';

import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';
import { useSelector } from '../suite';

export type GetCurrentRateParams = {
    currencyCode: FiatCurrencyCode;
    tokenAddress: TokenAddress;
};

type UseSendFormFieldsParams = UseFormReturn<FormState> & {
    fiatRate?: Rate;
    network: UseSendFormState['network'];
};

// This hook should be used only as a sub-hook of `useSendForm`
export const useSendFormFields = ({
    getValues,
    setValue,
    clearErrors,
    network,
    formState: { errors },
}: UseSendFormFieldsParams) => {
    const { shouldSendInSats } = useBitcoinAmountUnit(network.symbol);
    const currentRates = useSelector(selectCurrentFiatRates);

    const getCurrentFiatRate = useCallback(
        ({ currencyCode, tokenAddress }: GetCurrentRateParams) => {
            const fiatRateKey = getFiatRateKey(network.symbol, currencyCode, tokenAddress);

            return currentRates?.[fiatRateKey];
        },
        [currentRates, network.symbol],
    );

    type CalculateFiatFromAmountOrViceVersaParams = {
        outputId: number;
        target: 'fiat' | 'amount';
        formatTargetValue: (value: string, fiatRate: number) => string | null;
        value?: string;
    };

    const calculateFiatFromAmountOrViceVersa = useCallback(
        ({
            formatTargetValue,
            outputId,
            target,
            value,
        }: CalculateFiatFromAmountOrViceVersaParams) => {
            const { outputs } = getValues();
            const output = outputs[outputId];
            if (output.type !== 'payment') {
                return;
            }
            const targetValue = output[target];
            if (target === 'fiat' && typeof targetValue !== 'string') {
                return; // fiat input not registered (testnet or fiat not available)
            }
            const targetInputName = `outputs.${outputId}.${target}` as const;
            const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
            const error = outputError
                ? outputError[target === 'fiat' ? 'amount' : 'fiat']
                : undefined;
            if (error || !value) {
                if (targetValue.length > 0) {
                    setValue(targetInputName, '');
                    clearErrors(targetInputName);
                }

                return;
            }

            const fiatRate = getCurrentFiatRate({
                currencyCode: output.currency.value as FiatCurrencyCode,
                tokenAddress: output.token as TokenAddress,
            });
            if (!fiatRate?.rate) {
                return;
            }
            const formattedTargetValue = formatTargetValue(value, fiatRate.rate);
            if (formattedTargetValue) {
                setValue(targetInputName, formattedTargetValue, { shouldValidate: true });
            }
        },
        [clearErrors, getCurrentFiatRate, getValues, setValue, errors],
    );

    const calculateFiatFromAmount = useCallback(
        (outputId: number, amount: string) => {
            const calculateFormattedFiatValue = (amount: string, fiatRate: number) => {
                const formattedAmount = shouldSendInSats // toFiatCurrency always works with BTC, not satoshis
                    ? formatNetworkAmount(amount, network.symbol)
                    : amount;

                return toFiatCurrency(formattedAmount, fiatRate, 2);
            };

            return calculateFiatFromAmountOrViceVersa({
                formatTargetValue: calculateFormattedFiatValue,
                outputId,
                target: 'fiat',
                value: amount,
            });
        },
        [calculateFiatFromAmountOrViceVersa, shouldSendInSats, network.symbol],
    );

    const calculateAmountFromFiat = useCallback(
        (outputId: number, fiat: string, token?: TokenInfo) => {
            const calculateFormattedAmountValue = (fiat: string, fiatRate: number) => {
                const decimals = token ? token.decimals : network.decimals;
                const amount = fromFiatCurrency(fiat, decimals, fiatRate);

                return shouldSendInSats
                    ? amountToSmallestUnit(amount || '0', network.decimals)
                    : amount;
            };

            return calculateFiatFromAmountOrViceVersa({
                formatTargetValue: calculateFormattedAmountValue,
                outputId,
                target: 'amount',
                value: fiat,
            });
        },
        [calculateFiatFromAmountOrViceVersa, shouldSendInSats, network.decimals],
    );

    const setAmount = useCallback(
        (outputId: number, amount: string) => {
            setValue(`outputs.${outputId}.amount`, amount, {
                shouldValidate: amount.length > 0,
                shouldDirty: true,
            });
            calculateFiatFromAmount(outputId, amount);
        },
        [calculateFiatFromAmount, setValue],
    );

    const setMax = useCallback(
        (outputId: number, active: boolean) => {
            clearErrors([`outputs.${outputId}.amount`, `outputs.${outputId}.fiat`]);
            if (!active) {
                setValue(`outputs.${outputId}.amount`, '');
                setValue(`outputs.${outputId}.fiat`, '');
            }
            setValue('setMaxOutputId', active ? undefined : outputId);
        },
        [clearErrors, setValue],
    );

    const resetDefaultValue = useCallback(
        (fieldName: FieldPath<FormState>) => {
            // reset current value
            setValue(fieldName, '');
            // clear error
            clearErrors(fieldName);
        },
        [setValue, clearErrors],
    );

    // `outputs.x.fieldName` should be a regular `formState` value from `getValues()` method
    // however `useFieldArray` doesn't provide it BEFORE input is registered (it will be undefined on first render)
    // use fallbackValue from useFieldArray.fields if so, because `useFieldArray` architecture requires `defaultValue` to be provided for registered inputs
    const getDefaultValue: SendContextValues['getDefaultValue'] = (
        fieldName: FieldPath<FormState>,
        fallbackValue?: FieldPath<FormState>,
    ) => {
        if (fallbackValue !== undefined) {
            const stateValue = getValues(fieldName);
            if (stateValue !== undefined) return stateValue;

            return fallbackValue;
        }

        return getValues(fieldName);
    };

    const toggleOption = useCallback(
        (option: FormOptions) => {
            const enabledOptions = getValues('options') || [];
            const isEnabled = enabledOptions.includes(option);
            if (isEnabled) {
                setValue(
                    'options',
                    enabledOptions.filter(o => o !== option),
                );
            } else {
                setValue('options', [...enabledOptions, option]);
            }
        },
        [getValues, setValue],
    );

    return {
        getCurrentFiatRate,
        calculateAmountFromFiat,
        calculateFiatFromAmount,
        setAmount,
        resetDefaultValue,
        setMax,
        getDefaultValue,
        toggleOption,
    };
};
