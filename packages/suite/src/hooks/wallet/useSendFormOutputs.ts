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
    unregister,
    getValues,
    setValue,
    reset,
    clearErrors,
    localCurrencyOption,
    composeRequest,
}: Props) => {
    const addOutput = useCallback(() => {
        outputsFieldArray.append({
            ...DEFAULT_PAYMENT,
            currency: localCurrencyOption,
        });
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

            // TEMP: reset values for the Output which will be removed
            // react-hook-form somehow keeps cached values which has been set "from the outside" using setValue TODO: investigate more
            // use case example:
            // add second Output > click "send-max" (calculated "max" value will be set after compose) > remove second Output > add second Output again
            setValue(`outputs.${index}`, DEFAULT_PAYMENT);
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
                { errors: true },
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
            register({ name: `outputs.${index}.type`, type: 'custom' });
            // set defaultValues
            setValue(`outputs.${index}.type`, output.type);
        });
        return () => {
            // unregister fields
            fields.forEach((_output, index) => {
                unregister(`outputs.${index}.type`);
            });
        };
    }, [fields, register, unregister, setValue]);

    return {
        addOutput,
        removeOutput,
        addOpReturn,
        removeOpReturn,
    };
};
