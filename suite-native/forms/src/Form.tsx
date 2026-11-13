import { type ReactNode, createContext } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

export type { FieldValues, Path, UseFormReturn, FieldPathValue, Control } from 'react-hook-form';

export interface FormProps<
    TFieldValues extends FieldValues,
    TContext = object,
    TTransformedValues = TFieldValues,
> {
    children?: ReactNode;
    form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
}

export const FormContext = createContext<UseFormReturn>({} as UseFormReturn);

export const Form = <
    TFieldValues extends FieldValues,
    TContext = object,
    TTransformedValues = TFieldValues,
>({
    children,
    form,
}: FormProps<TFieldValues, TContext, TTransformedValues>) => {
    const formContextValue = {
        ...form,
    };

    return (
        <FormContext.Provider value={formContextValue as UseFormReturn<FieldValues>}>
            {children}
        </FormContext.Provider>
    );
};
