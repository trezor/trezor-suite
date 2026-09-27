import { useForm } from 'react-hook-form';
import { Button, Text } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { NativeTextInputField, type NativeTextInputFieldProps } from './NativeTextInputField';
import { Form } from '../Form';

type TestFormProps = Partial<NativeTextInputFieldProps> & {
    onSubmit?: (values: { url: string }) => void;
};

const TestForm = ({ onSubmit = jest.fn(), ...props }: TestFormProps) => {
    const form = useForm<{ url: string }>({
        defaultValues: { url: '' },
        mode: 'onBlur',
        resolver: values => ({
            values,
            errors: values.url ? {} : { url: { type: 'required', message: 'URL is required' } },
        }),
    });

    return (
        <Form form={form}>
            <NativeTextInputField name="url" label="Server URL" testID="url" {...props} />
            <Text>{form.formState.touchedFields.url ? 'touched' : 'untouched'}</Text>
            <Text>{form.formState.isDirty ? 'dirty' : 'pristine'}</Text>
            <Button title="Reset" onPress={() => form.reset({ url: 'https://default.example' })} />
            <Button title="Submit" onPress={form.handleSubmit(onSubmit)} />
        </Form>
    );
};

describe('NativeTextInputField', () => {
    it('keeps RHF blur validation and invokes the caller blur callback once', async () => {
        const onBlur = jest.fn();
        const { getByTestId, getByText, queryByText } = await renderWithBasicProvider(
            <TestForm onBlur={onBlur} />,
        );

        expect(getByText('untouched')).toBeOnTheScreen();
        expect(queryByText('URL is required')).toBeNull();

        await fireEvent(getByTestId('url'), 'focus');
        await fireEvent(getByTestId('url'), 'blur');

        expect(getByText('touched')).toBeOnTheScreen();
        expect(getByText('URL is required')).toBeOnTheScreen();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('preserves input callbacks and restores value, errors, touched and dirty state on reset', async () => {
        const onChangeText = jest.fn();
        const onSubmit = jest.fn();
        const { getByTestId, getByText, queryByText } = await renderWithBasicProvider(
            <TestForm onChangeText={onChangeText} onSubmit={onSubmit} />,
        );

        await fireEvent.changeText(getByTestId('url'), 'https://custom.example');
        expect(getByText('dirty')).toBeOnTheScreen();
        expect(onChangeText).toHaveBeenCalledTimes(1);
        expect(onChangeText).toHaveBeenCalledWith('https://custom.example');
        await fireEvent.press(getByText('Submit'));
        expect(onSubmit.mock.calls[0][0]).toEqual({ url: 'https://custom.example' });

        await fireEvent.changeText(getByTestId('url'), '');
        await fireEvent(getByTestId('url'), 'blur');
        expect(getByText('URL is required')).toBeOnTheScreen();
        await fireEvent.press(getByText('Reset'));

        expect(getByTestId('url')).toHaveDisplayValue('https://default.example');
        expect(getByText('pristine')).toBeOnTheScreen();
        expect(getByText('untouched')).toBeOnTheScreen();
        expect(queryByText('URL is required')).toBeNull();
        expect(onChangeText).toHaveBeenCalledTimes(2);
    });

    it('keeps transformed fields on the existing input and submits their untransformed value', async () => {
        const onSubmit = jest.fn();
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TestForm valueTransformer={value => value.toUpperCase()} onSubmit={onSubmit} />,
        );

        await fireEvent.changeText(getByTestId('url'), 'raw value');
        expect(getByTestId('url')).toHaveDisplayValue('RAW VALUE');
        await fireEvent.press(getByText('Submit'));
        expect(onSubmit.mock.calls[0][0]).toEqual({ url: 'raw value' });
    });
});
