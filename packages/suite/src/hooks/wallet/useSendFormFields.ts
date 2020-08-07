import { useCallback } from 'react';
import { UseFormMethods } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { FormState, SendContextProps } from '@wallet-types/sendForm';

type Props = UseFormMethods<FormState> & {
    fiatRates: SendContextProps['fiatRates'];
};

export const useSendFormFields = ({ control, getValues, setValue, fiatRates }: Props) => {
    const calculateFiat = useCallback(
        (outputIndex: number, amount?: string) => {
            const values = getValues();
            if (!values.outputs) return; // this happens during hot-reload
            const { fiat } = values.outputs[outputIndex];
            if (typeof fiat !== 'string') return; // fiat input not registered (testnet? fiat not available?)
            const inputName = `outputs[${outputIndex}].fiat`;
            if (!amount) {
                // reset fiat value (Amount field has error)
                if (fiat.length > 0) {
                    setValue(inputName, '', { shouldValidate: true });
                }
                return;
            }
            // calculate Fiat value
            if (!fiatRates || !fiatRates.current) return;
            const selectedCurrency = values.outputs[outputIndex].currency;
            const fiatValue = toFiatCurrency(
                amount,
                selectedCurrency.value,
                fiatRates.current.rates,
            );
            if (fiatValue) {
                setValue(inputName, fiatValue, { shouldValidate: true });
            }
        },
        [getValues, setValue, fiatRates],
    );

    const setAmount = useCallback(
        (outputIndex: number, amount: string) => {
            setValue(`outputs[${outputIndex}].amount`, amount, {
                shouldValidate: true,
                shouldDirty: true,
            });
            calculateFiat(outputIndex, amount);
        },
        [calculateFiat, setValue],
    );

    const changeFeeLevel = useCallback(
        (currentLevel: FeeLevel, newLevel: FeeLevel['label']) => {
            setValue('selectedFee', newLevel);
            const isCustom = newLevel === 'custom';
            // catch first change to custom
            if (isCustom) {
                setValue('feePerUnit', currentLevel.feePerUnit);
                setValue('feeLimit', currentLevel.feeLimit);
            }
        },
        [setValue],
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
        },
        [control, setValue],
    );

    // // save initial selected fee to reducer
    // useEffect(() => {
    //     setLastUsedFeeLevel(initialSelectedFee.label, symbol);
    // }, [setLastUsedFeeLevel, initialSelectedFee, symbol]);

    return {
        calculateFiat,
        setAmount,
        changeFeeLevel,
        resetDefaultValue,
    };
};
