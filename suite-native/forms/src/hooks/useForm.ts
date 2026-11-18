import {
    type FieldValues,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm as hookFormUseForm,
} from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { type AnyObject, type ObjectSchema } from 'yup';

export { useFormState, useWatch, useController } from 'react-hook-form';

interface UseFormArgs<
    TFieldValues extends FieldValues,
    TContext extends object,
    TTransformedValues extends FieldValues,
> extends Omit<UseFormProps<TFieldValues, TContext, TTransformedValues>, 'resolver'> {
    validation?: ObjectSchema<TTransformedValues, AnyObject>;
}

const createResolver = <
    TFieldValues extends FieldValues,
    TContext extends object,
    TTransformedValues extends FieldValues,
>(
    validation: ObjectSchema<TTransformedValues, AnyObject>,
) =>
    // The resolver types its input as the schema output, but at runtime it validates the raw
    // form values, which may differ before Yup casts and transforms them.
    yupResolver(validation) as unknown as Resolver<TFieldValues, TContext, TTransformedValues>;

// Without a schema the submit handler receives the raw form values, so a schema is required
// whenever they would not satisfy the declared validated output.
type ValidationRequirement<TFieldValues, TTransformedValues extends FieldValues> = [
    TFieldValues,
] extends [TTransformedValues]
    ? unknown
    : { validation: ObjectSchema<TTransformedValues, AnyObject> };

export const useForm = <
    TFieldValues extends FieldValues,
    TContext extends object = object,
    TTransformedValues extends FieldValues = TFieldValues,
>({
    validation,
    ...otherArgs
}: UseFormArgs<TFieldValues, TContext, TTransformedValues> &
    ValidationRequirement<TFieldValues, TTransformedValues>): UseFormReturn<
    TFieldValues,
    TContext,
    TTransformedValues
> =>
    hookFormUseForm<TFieldValues, TContext, TTransformedValues>({
        resolver: validation && createResolver(validation),
        reValidateMode: 'onChange',
        mode: 'onTouched',
        ...otherArgs,
    });
