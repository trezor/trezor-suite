import { useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { useActions } from '@suite-hooks';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import {
    Output,
    FormState,
    FormOptions,
    UseSendFormState,
    SendContextValues,
} from '@wallet-types/sendForm';

type Props = UseFormMethods<FormState> & {
    fiatRates: UseSendFormState['fiatRates'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormFields = ({
    control,
    getValues,
    setValue,
    errors,
    clearErrors,
    fiatRates,
}: Props) => {
    const { setLastUsedFeeLevel } = useActions({
        setLastUsedFeeLevel: walletSettingsActions.setLastUsedFeeLevel,
    });
    const calculateFiat = useCallback(
        (outputIndex: number, amount?: string) => {
            const output = getValues(`outputs[${outputIndex}]`) as Output;
            if (!output || output.type !== 'payment') return;
            const { fiat, currency } = output;
            if (typeof fiat !== 'string') return; // fiat input not registered (testnet? fiat not available?)
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

    const changeFeeLevel = useCallback(
        (currentLevel: FeeLevel, newLevel: FeeLevel) => {
            if (currentLevel.label === newLevel.label) return;
            setValue('selectedFee', newLevel.label);
            const isCustom = newLevel.label === 'custom';
            // catch first change to custom
            if (isCustom) {
                setValue('feePerUnit', currentLevel.feePerUnit);
                setValue('feeLimit', currentLevel.feeLimit);
                setLastUsedFeeLevel({
                    ...newLevel,
                    feePerUnit: currentLevel.feePerUnit,
                    feeLimit: currentLevel.feeLimit,
                });
            } else {
                // when switching from custom FeeLevel which has an error
                // this error should be cleared and transaction should be precomposed again
                // response is handled and used in @wallet-views/send/components/Fees (the caller of this function)
                const shouldCompose = errors.feePerUnit || errors.feeLimit;
                if (shouldCompose) {
                    clearErrors(['feePerUnit', 'feeLimit']);
                }
                setLastUsedFeeLevel(newLevel);
                return shouldCompose;
            }
        },
        [setValue, errors, clearErrors, setLastUsedFeeLevel],
    );

    const changeCustomFeeLevel = () => {
        const { feePerUnit, feeLimit } = getValues();
        setLastUsedFeeLevel({ label: 'custom', feePerUnit, feeLimit, blocks: -1 });
    };

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
        },
        [control, setValue],
    );

    // `output[x].fieldName` should be a regular `formState` value from `getValues()` method
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
        changeFeeLevel,
        changeCustomFeeLevel,
        resetDefaultValue,
        setMax,
        getDefaultValue,
        toggleOption,
    };
};
