import { type FormEventHandler, type ReactNode } from 'react';
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
    /** Everything `useForm` returned, handed over as one object rather than spread into props. */
    form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
    /**
     * `form.formState`, which the caller has to read into a binding of its own:
     * `const { formState } = form;`. In a tree the React Compiler compiles, `<Form form={form}>`
     * alone is memoised on the identity of `form` — react-hook-form's permanent ref — so the
     * element would be built once and this provider would never re-render again. The property has
     * to be its own value for the compiler to see that it changes; `formState={form.formState}`
     * does not work either, as the compiler folds that read back into the whole-object dependency.
     */
    formState: FormState<TFieldValues>;
    /** When given, the children are wrapped in a `form` element submitting to it. */
    onSubmit?: FormEventHandler<HTMLFormElement>;
    children: ReactNode;
}

export const Form = <TFieldValues extends FieldValues, TContext, TTransformedValues>({
    form,
    formState,
    onSubmit,
    children,
}: FormProps<TFieldValues, TContext, TTransformedValues>) => (
    // `formState` overrides what the spread carries: `form` is a react-hook-form ref whose
    // `formState` is replaced by a new proxy on every update, so the copy the spread takes is only
    // current as of the render that created this element. Passing it separately is what keeps
    // every `useFormContext().formState` read below answering out of the current snapshot.
    <FormProvider {...form} formState={formState}>
        {onSubmit ? <form onSubmit={onSubmit}>{children}</form> : children}
    </FormProvider>
);
