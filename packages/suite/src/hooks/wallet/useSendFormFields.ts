import { useCallback } from 'react';
import { type FieldPath, type UseFormReturn } from 'react-hook-form';

import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import {
    type FormOptions,
    type FormState,
    type Output,
    type Rate,
    type TokenAddress,
} from '@suite-common/wallet-types';
import {
    getFiatRateKey,
    parseBaseCurrencyToFormattedCrypto,
    parseCryptoToFormattedBaseCurrency,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode, TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { type SendContextValues, type UseSendFormState } from 'src/types/wallet/sendForm';

import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';
import { useSelector } from '../suite';

export type GetCurrentRateParams = {
    currencyCode: BaseCurrencyCode;
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
    const { shouldSendInSats, areSatsDisplayed } = useBitcoinAmountUnit(network.symbol);
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
        target: Extract<keyof Output, 'fiat' | 'amount'>;
        convertAndFormatTargetValue: (value: string, fiatRate: number) => string | null;
        value?: string;
    };

    const calculateFiatFromAmountOrViceVersa = useCallback(
        ({
            convertAndFormatTargetValue,
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
                currencyCode: output.currency.value as BaseCurrencyCode,
                tokenAddress: output.token as TokenAddress,
            });
            if (!fiatRate?.rate) {
                return;
            }
            const formattedTargetValue = convertAndFormatTargetValue(value, fiatRate.rate);
            if (formattedTargetValue) {
                setValue(targetInputName, formattedTargetValue, { shouldValidate: true });
            }
        },
        [clearErrors, getCurrentFiatRate, getValues, setValue, errors],
    );

    const calculateBaseCurrencyAmountFromCryptoAmount = useCallback(
        (outputId: number, amount: string) => {
            const convert = (amount: string, fiatRate: number) => {
                const { outputs } = getValues();
                const output = outputs[outputId];
                const baseCurrencyCode = output.currency.value;

                if (baseCurrencyCode === '') {
                    return null;
                }

                return parseCryptoToFormattedBaseCurrency({
                    baseCurrencyCode,
                    rate: fiatRate,
                    value: new BigNumber(amount),
                    baseCurrencyToSats: shouldSendInSats === true,
                    areSatsDisplayed,
                    symbol: network.symbol,
                });
            };

            return calculateFiatFromAmountOrViceVersa({
                convertAndFormatTargetValue: convert,
                outputId,
                target: 'fiat',
                value: amount,
            });
        },
        [
            calculateFiatFromAmountOrViceVersa,
            getValues,
            shouldSendInSats,
            areSatsDisplayed,
            network.symbol,
        ],
    );

    const calculateCryptoAmountFromBaseCurrencyAmount = useCallback(
        (outputId: number, fiat: string, token?: TokenInfo) => {
            const convert = (fiat: string, fiatRate: number) => {
                const cryptoDecimals = token ? token.decimals : network.decimals;

                const { outputs } = getValues();
                const output = outputs[outputId];

                const baseCurrencyCode = output.currency.value;

                if (baseCurrencyCode === '') {
                    return null;
                }

                return parseBaseCurrencyToFormattedCrypto({
                    cryptoDecimals,
                    rate: fiatRate,
                    isCryptoInSats: shouldSendInSats === true,
                    areSatsDisplayed: baseCurrencyCode === 'btc' && areSatsDisplayed,
                    value: new BigNumber(fiat),
                });
            };

            return calculateFiatFromAmountOrViceVersa({
                convertAndFormatTargetValue: convert,
                outputId,
                target: 'amount',
                value: fiat,
            });
        },
        [
            calculateFiatFromAmountOrViceVersa,
            network.decimals,
            getValues,
            shouldSendInSats,
            areSatsDisplayed,
        ],
    );

    const setAmount = useCallback(
        (outputId: number, amount: string) => {
            setValue(`outputs.${outputId}.amount`, amount, {
                shouldValidate: amount.length > 0,
                shouldDirty: true,
            });
            calculateBaseCurrencyAmountFromCryptoAmount(outputId, amount);
        },
        [calculateBaseCurrencyAmountFromCryptoAmount, setValue],
    );

    const setMax = useCallback(
        (outputId: number, active: boolean, clearInput?: boolean) => {
            clearErrors([`outputs.${outputId}.amount`, `outputs.${outputId}.fiat`]);
            if (clearInput || !active) {
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
        calculateCryptoAmountFromBaseCurrencyAmount,
        calculateBaseCurrencyAmountFromCryptoAmount,
        setAmount,
        resetDefaultValue,
        setMax,
        getDefaultValue,
        toggleOption,
    };
};
