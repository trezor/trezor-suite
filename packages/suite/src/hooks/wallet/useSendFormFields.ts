import { useCallback } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { FormOptions, FormState, Output, Rate, TokenAddress } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    asAmountUnit,
    asBaseCurrencyAmount,
    convertAmountUnitsToSubunits,
    fromFiatCurrency,
    getFiatRateKey,
    subunitsToUnits,
    toFiatCurrency,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { SendContextValues, UseSendFormState } from 'src/types/wallet/sendForm';

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
                currencyCode: output.currency.value as BaseCurrencyCode,
                tokenAddress: output.token as TokenAddress,
            });
            if (!fiatRate?.rate) {
                return;
            }
            const formattedTargetValue = formatTargetValue(value, fiatRate.rate);
            console.log('formattedTargetValue(', target, ') ', formattedTargetValue);
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
                const baseCurrency = output.currency.value as BaseCurrencyCode;

                const amountBigNumber = new BigNumber(amount);

                const cryptoAmount = shouldSendInSats // toFiatCurrency always works with BTC, not satoshis
                    ? subunitsToUnits(
                          asAmountSubunit(amountBigNumber, network.symbol),
                          network.symbol,
                      )
                    : asAmountUnit(amountBigNumber, network.symbol);

                const baseCurrencyAmountUnit = toFiatCurrency({
                    amount: cryptoAmount,
                    rate: fiatRate,
                });

                if (baseCurrencyAmountUnit === null) {
                    return null;
                }

                const baseCurrencyDisplay =
                    baseCurrency === 'btc' && areSatsDisplayed
                        ? asBaseCurrencyAmount(
                              unitsToSubunits(asAmountUnit(baseCurrencyAmountUnit, 'btc'), 'btc'),
                          )
                        : baseCurrencyAmountUnit;

                const baseCurrencyDecimals = baseCurrency === 'btc' && areSatsDisplayed ? 0 : 2;

                return baseCurrencyDisplay?.toFixed(baseCurrencyDecimals) ?? null;
            };

            return calculateFiatFromAmountOrViceVersa({
                formatTargetValue: convert,
                outputId,
                target: 'fiat',
                value: amount,
            });
        },
        [
            calculateFiatFromAmountOrViceVersa,
            getValues,
            shouldSendInSats,
            network.symbol,
            areSatsDisplayed,
        ],
    );

    const calculateCryptoAmountFromBaseCurrencyAmount = useCallback(
        (outputId: number, fiat: string, token?: TokenInfo) => {
            const convert = (fiat: string, fiatRate: number) => {
                const cryptoDecimals = token ? token.decimals : network.decimals;
                const fiatAmountBigNumber = new BigNumber(fiat);

                // When BTC is used as BaseCurrency, and we display all in Sats, we have to perform
                // the conversion from sats->btc, because crypto-amount here is expected to.
                const { outputs } = getValues();
                const output = outputs[outputId];
                const baseCurrency = output.currency.value as BaseCurrencyCode;
                const baseCurrencyUnitAmount =
                    baseCurrency === 'btc' && areSatsDisplayed
                        ? asBaseCurrencyAmount(
                              subunitsToUnits(asAmountSubunit(fiatAmountBigNumber, 'btc'), 'btc'),
                          )
                        : asBaseCurrencyAmount(fiatAmountBigNumber);

                const amount =
                    fromFiatCurrency({
                        fiatAmount: baseCurrencyUnitAmount.toFixed(),
                        rate: fiatRate,
                    })?.toFixed(cryptoDecimals) ?? null;

                return shouldSendInSats
                    ? convertAmountUnitsToSubunits(amount || '0', network.decimals)
                    : amount;
            };

            return calculateFiatFromAmountOrViceVersa({
                formatTargetValue: convert,
                outputId,
                target: 'amount',
                value: fiat,
            });
        },
        [
            calculateFiatFromAmountOrViceVersa,
            network.decimals,
            getValues,
            areSatsDisplayed,
            shouldSendInSats,
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
        (outputId: number) => {
            clearErrors([`outputs.${outputId}.amount`, `outputs.${outputId}.fiat`]);
            setValue('setMaxOutputId', outputId);
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
