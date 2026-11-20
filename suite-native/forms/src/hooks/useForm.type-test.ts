import { type UseFormReturn } from 'react-hook-form';

import { yup } from '../yup';
import { useForm } from './useForm';

type AmountFormValues = {
    amount: string;
    note?: string;
};

const amountSchema = yup.object({
    amount: yup.number().required(),
});

type NetworkContext = { networkSymbol: string };

const useFormTypeTests = () => {
    const transformingForm = useForm<AmountFormValues, object, yup.InferType<typeof amountSchema>>({
        validation: amountSchema,
        defaultValues: { amount: '' },
    });

    transformingForm.handleSubmit(values => {
        const validAmount: number = values.amount;
        // @ts-expect-error The submit handler receives the validated output, not the form values.
        const invalidAmount: string = values.amount;
        void validAmount;
        void invalidAmount;
    });

    const formValue: string = transformingForm.getValues('amount');
    void formValue;

    const sameShapeForm = useForm<AmountFormValues>({
        validation: yup.object({ amount: yup.string().required(), note: yup.string() }),
    });
    const sameShapeFormReturn: UseFormReturn<AmountFormValues> = sameShapeForm;
    void sameShapeFormReturn;

    useForm<AmountFormValues>({
        // @ts-expect-error A schema whose output differs from the form values needs the output generic.
        validation: amountSchema,
    });

    // @ts-expect-error A validated output the raw form values do not satisfy requires a schema.
    useForm<AmountFormValues, object, yup.InferType<typeof amountSchema>>({});

    const unvalidatedForm = useForm<AmountFormValues>({ defaultValues: { amount: '' } });
    const unvalidatedFormReturn: UseFormReturn<AmountFormValues> = unvalidatedForm;
    void unvalidatedFormReturn;

    const contextSchema = yup.object({
        amount: yup.string<string, NetworkContext>().required(),
    });

    useForm<{ amount: string }, NetworkContext>({
        validation: contextSchema,
        context: { networkSymbol: 'btc' },
    });

    useForm<{ amount: string }, NetworkContext>({
        validation: contextSchema,
        // @ts-expect-error The context must match the form's context type.
        context: { networkSymbol: 1 },
    });
};

void useFormTypeTests;
