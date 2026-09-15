import { type ReactNode, type SubmitEventHandler } from 'react';
import {
    type FieldValues,
    FormProvider,
    type FormState,
    type UseFormReturn,
} from 'react-hook-form';

export interface FormProps<
    TFieldValues extends FieldValues,
    TContext = unknown,
    TTransformedValues = TFieldValues,
> {
    /**
     * Everything `useForm` returned, handed over as one object.
     */
    form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;

    /**
     * **`formState` must be passed as a separate prop from `form` object and don't pass it as `form.formState`**:
     *
     * ```tsx
     * const form = useForm();
     * const { formState } = form;
     *
     * return <Form form={form} formState={formState}>{children}</Form>;
     * ```
     *
     * because `useForm` returns a ref whose identity never changes, while the `formState` on it is replaced
     * by a new proxy on every update and each proxy answers out of the snapshot it was built from.
     * The React Compiler memoises `<Form form={form}>` on that unchanging identity, so without a
     * second dependency that moves, this provider is built once and every
     * `useFormContext().formState` read below it stays frozen at its first value.
     *
     * Spelling it `formState={form.formState}` does not help, because within one memoization scope
     * the compiler reduces every dependency chain to its shortest prefix:
     *
     * `form={form}` already contributes `form`, so the longer path `form.formState` adds nothing to the guard.
     * React compiler assumes the `form` object has immutable values, and react-hook-form breaks the
     * assumption by swapping `formState` on an object whose identity stays put. A separate binding
     * sidesteps it by being a value read during this render rather than a path through `form`.
     */
    formState: FormState<TFieldValues>;

    /**
     * When given, the children are wrapped in a `form` element submitting to it.
     */
    onSubmit?: SubmitEventHandler<HTMLFormElement>;

    children: ReactNode;
}

/**
 * A wrapper component for forms using `react-hook-form`.
 * It provides the form context (`FormProvider`) to its children and optionally wraps them in a `form` element with a submit handler.
 */
export const Form = <TFieldValues extends FieldValues, TContext, TTransformedValues>({
    form,
    formState,
    onSubmit,
    children,
}: FormProps<TFieldValues, TContext, TTransformedValues>) => (
    <FormProvider {...form} formState={formState}>
        {onSubmit ? <form onSubmit={onSubmit}>{children}</form> : children}
    </FormProvider>
);
