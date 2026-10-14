import {
    type FieldValues,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm as hookFormUseForm,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';

type ValidationSchema = Parameters<typeof yupResolver>[0];

export { useFormState, useWatch, useController } from 'react-hook-form';

interface UseFormArgs<
    TFieldValues extends FieldValues = FieldValues,
    TContext extends object = object,
> extends Omit<UseFormProps<TFieldValues, TContext>, 'resolver'> {
    validation: ValidationSchema;
}

export const useForm = <TFieldValues extends FieldValues, TContext extends object = object>({
    validation,
    ...otherArgs
}: UseFormArgs<TFieldValues, TContext>): UseFormReturn<TFieldValues> => {
    // Some consumers use partial schemas or transform values in Yup.
    // Keep the existing unchecked form contract here until schema input and output
    // types can be represented separately.
    const resolver = yupResolver(validation) as unknown as Resolver<
        TFieldValues,
        TContext,
        TFieldValues
    >;

    const form = hookFormUseForm<TFieldValues, TContext>({
        resolver,
        reValidateMode: 'onChange',
        mode: 'onTouched',
        ...otherArgs,
    });

    return form;
};
