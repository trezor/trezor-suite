import React from 'react';
import { Control, FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
    children?: React.ReactNode;
    form: UseFormReturn<TFieldValues>;
}

interface FormContextValue<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
}

export const FormContext = React.createContext<FormContextValue<FieldValues>>(
    {} as FormContextValue<FieldValues>,
);

export const Form = <TFieldValues extends FieldValues>({
    children,
    form,
}: FormProps<TFieldValues>) => {
    // TODO: once react-hook-form is upgraded to v7 remove errors, because it will be accessible via useControl.
    // It will same some unnecessary rerenders. Also FormContext from rhf should't be used because
    // there is lof of unnecessary stuff that will cause extra rerenders, but we need only control.
    const formContextValue = {
        control: form.control,
        errors: form.formState.errors,
    };

    return (
        <FormContext.Provider value={formContextValue as FormContextValue<FieldValues>}>
            {children}
        </FormContext.Provider>
    );
};
