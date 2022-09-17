import {
    FieldValues,
    useForm as hookFormUseForm,
    UseFormMethods,
    UseFormOptions,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { AnyObjectSchema } from 'yup';

interface UseFormArgs<
    TFieldValues extends FieldValues = FieldValues,
    TContext extends object = object,
> extends Omit<UseFormOptions<TFieldValues, TContext>, 'resolver'> {
    validation: AnyObjectSchema;
}

export const useForm = <TFieldValues extends FieldValues, TContext extends object = object>({
    validation,
    ...otherArgs
}: UseFormArgs<TFieldValues, TContext>): UseFormMethods<TFieldValues> => {
    const form = hookFormUseForm<TFieldValues>({
        resolver: yupResolver(validation),
        reValidateMode: 'onChange',
        mode: 'onTouched',
        ...otherArgs,
    });

    return form;
};
