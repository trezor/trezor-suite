import { createContext, ReactNode } from 'react';
import { Control, FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
    children?: ReactNode;
    form: UseFormReturn<TFieldValues>;
}

interface FormContextValue<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
}

export const FormContext = createContext<FormContextValue<FieldValues>>(
    {} as FormContextValue<FieldValues>,
);

export const Form = <TFieldValues extends FieldValues>({
    children,
    form,
}: FormProps<TFieldValues>) => {
    const formContextValue = {
        control: form.control,
    };

    return (
        <FormContext.Provider value={formContextValue as FormContextValue<FieldValues>}>
            {children}
        </FormContext.Provider>
    );
};
