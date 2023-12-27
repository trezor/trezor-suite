import { useCallback, useEffect } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { FormState, UseSendFormState, SendContextValues } from 'src/types/wallet/sendForm';
import { DEFAULT_PAYMENT, DEFAULT_OPRETURN } from '@suite-common/wallet-constants';

type Props = UseFormReturn<FormState> & {
    outputsFieldArray: ReturnType<typeof useFieldArray<FormState, 'outputs'>>;
    localCurrencyOption: UseSendFormState['localCurrencyOption'];
    composeRequest: SendContextValues['composeTransaction'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormOutputs = ({
    outputsFieldArray,
    register,
    getValues,
    setValue,
    reset,
    clearErrors,
    localCurrencyOption,
    composeRequest,
}: Props) => {
    const addOutput = useCallback(() => {
        outputsFieldArray.append(
            {
                ...DEFAULT_PAYMENT,
                currency: localCurrencyOption,
            },
            { shouldFocus: true },
        );
    }, [localCurrencyOption, outputsFieldArray]);

    const removeOutput = useCallback(
        (index: number) => {
            const values = getValues();
            const { setMaxOutputId } = values;
            if (setMaxOutputId === index) {
                // reset setMaxOutputId
                setValue('setMaxOutputId', undefined);
            }
            if (typeof setMaxOutputId === 'number' && setMaxOutputId > index) {
                // reduce setMaxOutputId
                setValue('setMaxOutputId', setMaxOutputId - 1);
            }

            outputsFieldArray.remove(index);
        },
        [getValues, setValue, outputsFieldArray],
    );

    const addOpReturn = () => {
        // const outputs = getValues('outputs');
        const values = getValues();
        const lastOutput = values.outputs[values.outputs.length - 1];
        const isLastOutputDirty = lastOutput.address.length > 0 || lastOutput.amount.length > 0;
        if (isLastOutputDirty) {
            outputsFieldArray.append({ ...DEFAULT_OPRETURN });
        } else {
            reset(
                {
                    ...values,
                    outputs: [DEFAULT_OPRETURN],
                },
                { keepErrors: true },
            );
        }
    };

    const removeOpReturn = (index: number) => {
        const values = getValues();
        if (values.outputs.length > 1) {
            removeOutput(index);
        } else {
            clearErrors('outputs.0');
            reset(
                {
                    ...values,
                    outputs: [
                        {
                            ...DEFAULT_PAYMENT,
                            currency: localCurrencyOption,
                        },
                    ],
                },
                { keepErrors: true },
            );
        }
        composeRequest('outputs.0.amount');
    };

    // each Output has additional uncontrolled values that need to be present in FormState
    // they need to be registered without any HTMLElement as a "custom" field
    const { fields } = outputsFieldArray;
    useEffect(() => {
        fields.forEach((output, index) => {
            register(`outputs.${index}.type`, { shouldUnregister: true });
            // set defaultValues
            setValue(`outputs.${index}.type`, output.type);
        });
    }, [fields, register, setValue]);

    return {
        addOutput,
        removeOutput,
        addOpReturn,
        removeOpReturn,
    };
};
