import { useCallback } from 'react';
import { useFieldArray, UseFormMethods } from 'react-hook-form';
import { FormState, UseSendFormState, SendContextValues } from '@wallet-types/sendForm';
import { DEFAULT_PAYMENT, DEFAULT_OPRETURN } from '@wallet-constants/sendForm';

type Props = UseFormMethods<FormState> & {
    outputsFieldArray: ReturnType<typeof useFieldArray>;
    localCurrencyOption: UseSendFormState['localCurrencyOption'];
    composeRequest: SendContextValues['composeTransaction'];
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormOutputs = ({
    outputsFieldArray,
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
        async (index: number) => {
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
                { errors: true },
            );
        }
    };

    const removeOpReturn = (index: number) => {
        const values = getValues();
        if (values.outputs.length > 1) {
            removeOutput(index);
        } else {
            clearErrors('outputs[0]');
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
                { errors: true },
            );
        }
        composeRequest('outputs[0].amount');
    };

    return {
        addOutput,
        removeOutput,
        addOpReturn,
        removeOpReturn,
    };
};
