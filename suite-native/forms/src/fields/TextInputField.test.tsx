import { yup } from '@suite-common/validators';
import { Button } from '@suite-native/atoms';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { TextInputField } from './TextInputField';
import { Form } from '../Form';
import { useForm } from '../hooks/useForm';

type TestFormProps = {
    validation: Parameters<typeof useForm>[0]['validation'];
    defaultValue?: string;
};

const TestForm = ({ validation, defaultValue = '' }: TestFormProps) => {
    const form = useForm({ validation });

    return (
        <Form form={form}>
            <TextInputField
                name="value"
                label="Value"
                testID="value-input"
                defaultValue={defaultValue}
            />
            <Button testID="submit-button" onPress={form.handleSubmit(jest.fn())}>
                Submit
            </Button>
        </Form>
    );
};

type ValidationCase = {
    tag: string;
    translationKey: TxKeyPath;
    validation: TestFormProps['validation'];
    value: string;
};

describe('TextInputField', () => {
    it.each<ValidationCase>([
        {
            tag: 'TR_REQUIRED_FIELD',
            translationKey: 'generic.formValidation.required',
            validation: yup.object({ value: yup.string().required() }),
            value: '',
        },
        {
            tag: 'TR_EXCEEDS_MAX',
            translationKey: 'generic.formValidation.exceedsMax',
            validation: yup.object({ value: yup.string().max(3) }),
            value: 'abcd',
        },
        {
            tag: 'TR_ASCII_ONLY',
            translationKey: 'generic.formValidation.asciiOnly',
            validation: yup.object({ value: yup.string().isAscii() }),
            value: 'Příliš',
        },
        {
            tag: 'DATA_NOT_VALID_HEX',
            translationKey: 'generic.formValidation.notValidHex',
            validation: yup.object({ value: yup.string().isHex() }),
            value: 'xyz',
        },
    ])(
        'should translate the $tag validation message',
        async ({ tag, translationKey, validation, value }) => {
            const { getByTestId, getByText, queryByText } = await renderWithBasicProvider(
                <TestForm validation={validation} defaultValue={value} />,
            );

            await fireEvent.press(getByTestId('submit-button'));

            await waitFor(() => {
                expect(getByText(getTranslation(translationKey))).toBeTruthy();
            });
            expect(queryByText(tag)).toBeNull();
        },
    );

    it('should keep a custom validation message as it is', async () => {
        const { getByTestId, getByText } = await renderWithBasicProvider(
            <TestForm
                validation={yup.object({ value: yup.string().required('Value is required') })}
            />,
        );

        await fireEvent.press(getByTestId('submit-button'));

        await waitFor(() => {
            expect(getByText('Value is required')).toBeTruthy();
        });
    });
});
