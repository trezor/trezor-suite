import { createContext, ReactNode } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
    children?: ReactNode;
    form: UseFormReturn<TFieldValues>;
}

export const FormContext = createContext<UseFormReturn>({} as UseFormReturn);

export const Form = <TFieldValues extends FieldValues>({
    children,
    form,
}: FormProps<TFieldValues>) => {
    const formContextValue = {
        ...form,
    };

    return (
        <FormContext.Provider value={formContextValue as UseFormReturn<FieldValues>}>
            {children}
        </FormContext.Provider>
    );
};
