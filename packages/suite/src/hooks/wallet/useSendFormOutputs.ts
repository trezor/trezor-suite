import { useCallback, useEffect } from 'react';
import { type UseFormReturn, type useFieldArray } from 'react-hook-form';

import { DEFAULT_OPRETURN, DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import { type FormState } from '@suite-common/wallet-types';

import { type SendContextValues, type UseSendFormState } from 'src/types/wallet/sendForm';

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
        const lastOpReturn = outputsFieldArray.fields.at(-1)?.type === 'opreturn';
        outputsFieldArray.insert(
            outputsFieldArray.fields.length - Number(lastOpReturn),
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
        const outputsDirty = values.outputs.some(
            output => output.address.length > 0 || output.amount.length > 0,
        );
        if (outputsDirty) {
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
