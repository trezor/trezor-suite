import { useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import {
    FormState,
    FormOptions,
    UseSendFormState,
    SendContextValues,
} from '@wallet-types/sendForm';
import { isEnabled as isFeatureEnabled } from '@suite-utils/features';

type Props = UseFormMethods<FormState> & {
    fiatRates: UseSendFormState['fiatRates'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormFields = ({
    control,
    getValues,
    setValue,
    clearErrors,
    fiatRates,
}: Props) => {
    const calculateFiat = useCallback(
        (outputIndex: number, amount?: string) => {
            const { outputs } = getValues();
            const output = outputs ? outputs[outputIndex] : undefined;
            if (!output || output.type !== 'payment') return;
            const { fiat, currency } = output;
            if (typeof fiat !== 'string') return; // fiat input not registered (testnet or fiat not available)
            const inputName = `outputs[${outputIndex}].fiat`;
            if (!amount) {
                // reset fiat value (Amount field has error)
                if (fiat.length > 0) {
                    setValue(inputName, '');
                }
                return;
            }
            // calculate Fiat value
            if (!fiatRates || !fiatRates.current) return;
            const fiatValue = toFiatCurrency(amount, currency.value, fiatRates.current.rates);
            if (fiatValue) {
                setValue(inputName, fiatValue, { shouldValidate: true });
            }
        },
        [getValues, setValue, fiatRates],
    );

    const setAmount = useCallback(
        (outputIndex: number, amount: string) => {
            setValue(`outputs[${outputIndex}].amount`, amount, {
                shouldValidate: amount.length > 0,
                shouldDirty: true,
            });
            calculateFiat(outputIndex, amount);
        },
        [calculateFiat, setValue],
    );

    const setMax = useCallback(
        (outputIndex: number, active: boolean) => {
            clearErrors([`outputs[${outputIndex}].amount`, `outputs[${outputIndex}].fiat`]);
            if (!active) {
                setValue(`outputs[${outputIndex}].amount`, '');
                setValue(`outputs[${outputIndex}].fiat`, '');
            }
            setValue('setMaxOutputId', active ? undefined : outputIndex);
        },
        [clearErrors, setValue],
    );

    const resetDefaultValue = useCallback(
        (fieldName: string) => {
            // Since some fields are registered conditionally (locktime, rippleDestinationTag etc..)
            // they will set defaultValue from draft on every mount
            // to prevent that behavior reset defaultValue in `react-hook-form.control.defaultValuesRef`
            const { current } = control.defaultValuesRef;
            // @ts-ignore: react-hook-form type returns "unknown" (bug?)
            if (current && current[fieldName]) current[fieldName] = '';
            // reset current value
            setValue(fieldName, '');
            // clear error
            clearErrors(fieldName);
        },
        [control, setValue, clearErrors],
    );

    // `outputs[x].fieldName` should be a regular `formState` value from `getValues()` method
    // however `useFieldArray` doesn't provide it BEFORE input is registered (it will be undefined on first render)
    // use fallbackValue from useFieldArray.fields if so, because `useFieldArray` architecture requires `defaultValue` to be provided for registered inputs
    const getDefaultValue: SendContextValues['getDefaultValue'] = <K extends string, T = undefined>(
        fieldName: K,
        fallbackValue?: T,
    ) => {
        if (fallbackValue !== undefined) {
            const stateValue = getValues<K, T>(fieldName);
            if (stateValue !== undefined) return stateValue;
            return fallbackValue;
        }
        return getValues<K, T>(fieldName);
    };

    const toggleOption = (option: FormOptions) => {
        if (!isFeatureEnabled('RBF') && option === 'bitcoinRBF') {
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
