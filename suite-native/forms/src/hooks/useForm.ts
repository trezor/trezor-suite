import {
    FieldValues,
    useForm as hookFormUseForm,
    UseFormReturn,
    UseFormProps,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { AnyObjectSchema } from 'yup';

interface UseFormArgs<
    TFieldValues extends FieldValues = FieldValues,
    TContext extends object = object,
> extends Omit<UseFormProps<TFieldValues, TContext>, 'resolver'> {
    validation: AnyObjectSchema;
}

export const useForm = <TFieldValues extends FieldValues, TContext extends object = object>({
    validation,
    ...otherArgs
}: UseFormArgs<TFieldValues, TContext>): UseFormReturn<TFieldValues> => {
    const form = hookFormUseForm<TFieldValues, TContext>({
        resolver: yupResolver(validation),
        reValidateMode: 'onChange',
        mode: 'onTouched',
        ...otherArgs,
    });

    return form;
};
