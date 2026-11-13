import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { yup } from '../yup';
import { useForm } from './useForm';

type AmountFormValues = {
    amount: string;
};

const amountSchema = yup.object({
    amount: yup.number().typeError('Invalid number').required(),
});

describe('useForm', () => {
    it('submits the values transformed by the validation schema', async () => {
        const onSubmit = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useForm<AmountFormValues, object, yup.InferType<typeof amountSchema>>({
                validation: amountSchema,
                defaultValues: { amount: '12.5' },
            }),
        );

        await act(() => result.current.handleSubmit(onSubmit)());

        expect(onSubmit).toHaveBeenCalledWith({ amount: 12.5 }, undefined);
        expect(result.current.getValues('amount')).toBe('12.5');
    });

    it('does not submit values the validation schema rejects', async () => {
        const onSubmit = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useForm<AmountFormValues, object, yup.InferType<typeof amountSchema>>({
                validation: amountSchema,
                defaultValues: { amount: 'abc' },
            }),
        );

        await act(() => result.current.handleSubmit(onSubmit)());

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.getFieldState('amount').error?.message).toBe('Invalid number');
    });

    it('submits the form values unchanged without a validation schema', async () => {
        const onSubmit = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useForm<AmountFormValues>({ defaultValues: { amount: 'abc' } }),
        );

        await act(() => result.current.handleSubmit(onSubmit)());

        expect(onSubmit).toHaveBeenCalledWith({ amount: 'abc' }, undefined);
    });
});
