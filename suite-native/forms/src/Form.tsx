import { createContext, ReactNode } from 'react';
import { Control, FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormProps<TFieldValues extends FieldValues> {
    children?: ReactNode;
    form: UseFormReturn<TFieldValues>;
}

export interface FormContextValue<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
    setValue: UseFormReturn<TFieldValues>['setValue'];
    getValues: UseFormReturn<TFieldValues>['getValues'];
    handleSubmit: UseFormReturn<TFieldValues>['handleSubmit'];
    watch: UseFormReturn<TFieldValues>['watch'];
    formState: UseFormReturn<TFieldValues>['formState'];
    reset: UseFormReturn<TFieldValues>['reset'];
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
        setValue: form.setValue,
        getValues: form.getValues,
        handleSubmit: form.handleSubmit,
        watch: form.watch,
        formState: form.formState,
        reset: form.reset,
    };

    return (
        <FormContext.Provider value={formContextValue as FormContextValue<FieldValues>}>
            {children}
        </FormContext.Provider>
    );
};
