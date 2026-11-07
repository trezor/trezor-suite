import {
    type FieldValues,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm as hookFormUseForm,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { zodResolver } from '@hookform/resolvers/zod';
import { type z } from 'zod';

// Shared suite-common schemas are written in zod, native ones in yup.
type ValidationSchema = Parameters<typeof yupResolver>[0] | z.ZodType<FieldValues, FieldValues>;

// Every zod schema carries `_zod`; yup schemas do not.
const getResolver = (validation: ValidationSchema) =>
    '_zod' in validation ? zodResolver(validation) : yupResolver(validation);

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
    // TS7 infers Yup object schemas as transformed optionalized shapes
    // (`MakeKeysOptional<T>`) which does not match the form contract used
    // across suite-native. Keep that mismatch contained in this wrapper.
    const resolver = getResolver(validation) as Resolver<TFieldValues, TContext, TFieldValues>;

    const form = hookFormUseForm<TFieldValues, TContext>({
        resolver,
        reValidateMode: 'onChange',
        mode: 'onTouched',
        ...otherArgs,
    });

    return form;
};
