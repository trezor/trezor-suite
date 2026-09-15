/** @jest-environment jsdom */

import { useForm, useFormContext } from 'react-hook-form';

import { fireEvent, render, screen } from '@testing-library/react';

import { Form } from './Form';

interface TestFormValues {
    name: string;
}

const DefaultNameProbe = () => {
    const { formState } = useFormContext<TestFormValues>();

    return <p>{formState.defaultValues?.name}</p>;
};

describe('Form', () => {
    it('provides the `formState` prop rather than the one the `form` spread carries', () => {
        const Harness = () => {
            const form = useForm<TestFormValues>({ defaultValues: { name: 'carried by form' } });
            const other = useForm<TestFormValues>({ defaultValues: { name: 'passed explicitly' } });

            return (
                <Form form={form} formState={other.formState}>
                    <DefaultNameProbe />
                </Form>
            );
        };

        render(<Harness />);

        expect(screen.getByText('passed explicitly')).toBeDefined();
    });

    it('renders the children bare when no `onSubmit` is given', () => {
        const Harness = () => {
            const form = useForm<TestFormValues>();

            return (
                <Form form={form} formState={form.formState}>
                    <button type="submit">submit</button>
                </Form>
            );
        };

        const { container } = render(<Harness />);

        expect(container.querySelector('form')).toBeNull();
    });

    it('wraps the children in a form element submitting to `onSubmit`', () => {
        const onSubmit = jest.fn(event => event.preventDefault());

        const Harness = () => {
            const form = useForm<TestFormValues>();

            return (
                <Form form={form} formState={form.formState} onSubmit={onSubmit}>
                    <button type="submit">submit</button>
                </Form>
            );
        };

        const { container } = render(<Harness />);

        expect(container.querySelector('form')).not.toBeNull();

        fireEvent.click(screen.getByText('submit'));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
