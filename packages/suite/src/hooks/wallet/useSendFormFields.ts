import { useCallback } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';
import { formatNetworkAmount, toFiatCurrency } from '@suite-common/wallet-utils';
import {
    FormState,
    FormOptions,
    UseSendFormState,
    SendContextValues,
} from 'src/types/wallet/sendForm';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';
import { CoinFiatRates } from '@suite-common/wallet-types';

type Props = UseFormReturn<FormState> & {
    fiatRates?: CoinFiatRates;
    network: UseSendFormState['network'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormFields = ({
    getValues,
    setValue,
    clearErrors,
    fiatRates,
    network,
    formState: { errors },
}: Props) => {
    const { shouldSendInSats } = useBitcoinAmountUnit(network.symbol);

    const calculateFiat = useCallback(
        (outputIndex: number, amount?: string) => {
            const outputError = errors.outputs ? errors.outputs[outputIndex] : undefined;
            const error = outputError ? outputError.amount : undefined;

            if (error) {
                amount = undefined;
            }

            const { outputs } = getValues();
            const output = outputs ? outputs[outputIndex] : undefined;
            if (!output || output.type !== 'payment') return;
            const { fiat, currency } = output;
            if (typeof fiat !== 'string') return; // fiat input not registered (testnet or fiat not available)
            const inputName = `outputs.${outputIndex}.fiat` as const;
            if (!amount) {
                // reset fiat value (Amount field has error)
                if (fiat.length > 0) {
                    setValue(inputName, '');
                }
                return;
            }
            // calculate Fiat value
            if (!fiatRates || !fiatRates.current) return;

            const formattedAmount = shouldSendInSats // toFiatCurrency always works with BTC, not satoshis
                ? formatNetworkAmount(amount, network.symbol)
                : amount;

            const fiatValue = toFiatCurrency(
                formattedAmount,
                currency.value,
                fiatRates.current.rates,
            );
            if (fiatValue) {
                setValue(inputName, fiatValue, { shouldValidate: true });
            }
        },
        [getValues, setValue, fiatRates, shouldSendInSats, network.symbol, errors],
    );

    const setAmount = useCallback(
        (outputIndex: number, amount: string) => {
            setValue(`outputs.${outputIndex}.amount`, amount, {
                shouldValidate: amount.length > 0,
                shouldDirty: true,
            });
            calculateFiat(outputIndex, amount);
        },
        [calculateFiat, setValue],
    );

    const setMax = useCallback(
        (outputIndex: number, active: boolean) => {
            clearErrors([`outputs.${outputIndex}.amount`, `outputs.${outputIndex}.fiat`]);
            if (!active) {
                setValue(`outputs.${outputIndex}.amount`, '');
                setValue(`outputs.${outputIndex}.fiat`, '');
            }
            setValue('setMaxOutputId', active ? undefined : outputIndex);
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

    const toggleOption = (option: FormOptions) => {
        if (
            option === 'bitcoinRBF' &&
            (!isFeatureFlagEnabled('RBF') || !network.features?.includes('rbf'))
        ) {
            // do not use RBF if disabled
            return;
        }
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
    };

    return {
        calculateFiat,
        setAmount,
        resetDefaultValue,
        setMax,
        getDefaultValue,
        toggleOption,
    };
};
