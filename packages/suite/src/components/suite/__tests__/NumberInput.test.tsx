import { useForm } from 'react-hook-form';
import { Provider } from 'react-redux';

import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Store } from 'redux';

import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '@suite/settings';
import { type Locale } from '@suite-common/suite-types';
import { configureMockStore } from '@suite-common/test-utils';
import { NumberInput, isExtraDecimalSeparator } from '@trezor/product-components';

import { extraDependencies } from 'src/support/extraDependencies';
import { ThemeProvider } from 'src/support/suite/ThemeProvider';

const onChangeMock = jest.fn();

interface InputWithFormProps {
    store: Store;
    locale: Locale;
}

const InputWithForm = ({ store, locale }: InputWithFormProps) => {
    const { control } = useForm({
        defaultValues: {
            input: '',
        },
    });

    return (
        <Provider store={store}>
            <ThemeProvider>
                <NumberInput
                    control={control}
                    name="input"
                    data-testid="number-input"
                    onChange={onChangeMock}
                    locale={locale}
                />
            </ThemeProvider>
        </Provider>
    );
};

const renderInput = (language: Locale) => {
    const suiteSettingsReducer = prepareSuiteSettingsReducer(extraDependencies);
    const store = configureMockStore({
        reducer: { suiteSettings: suiteSettingsReducer },
        preloadedState: {
            suiteSettings: { ...suiteSettingsInitialState, language },
        },
    });

    const { getByTestId } = render(<InputWithForm store={store} locale={language} />);
    const input = getByTestId('number-input') as HTMLInputElement;

    return input;
};

const testCase = async (
    element: HTMLInputElement,
    userInput: string,
    displayed: string,
    reported: string,
) => {
    // Wrap user events in act() to ensure all updates are flushed.
    await act(async () => {
        await userEvent.type(element, userInput);
    });
    expect(element.value).toBe(displayed);
    expect(onChangeMock).toHaveBeenCalledWith(reported);
    await act(async () => {
        await userEvent.clear(element);
    });
};

describe('NumberInput component', () => {
    test('Formats with the en locale', async () => {
        const input = renderInput('en-US');

        await testCase(input, '12345.67', '12,345.67', '12345.67');
        await testCase(input, '1234,67', '1,234.67', '1234.67');

        await testCase(input, '.', '.', '0');
        await testCase(input, '0', '0', '0');
        await testCase(input, '00', '0', '0');
        await testCase(input, '0.', '0.', '0');

        await testCase(input, ',67', '0.67', '0.67');
        await testCase(input, '.67', '0.67', '0.67');
        await testCase(input, '.,67', '0.67', '0.67');
        await testCase(input, ',.067', '0.067', '0.067');

        await testCase(input, '12 34,,67', '1,234.67', '1234.67');
        await testCase(input, '12 34,.67', '1,234.67', '1234.67');
        await testCase(input, '  1234,.67.231', '1,234.67231', '1234.67231');

        await testCase(input, '1.2.3', '1.23', '1.23');
        await testCase(input, '0.001.1.1', '0.00111', '0.00111');
        await testCase(input, '0..5', '0.5', '0.5');

        await testCase(input, 'a', '', '');
        await testCase(input, '1234adf134', '1,234,134', '1234134');
    });

    test('Formats with the cs locale', async () => {
        const input = renderInput('cs-CZ');

        await testCase(input, '22345.67', '22\u00A0345,67', '22345.67');
        await testCase(input, '2234,67', '2\u00A0234,67', '2234.67');

        await testCase(input, ',', ',', '0');
        await testCase(input, '0', '0', '0');
        await testCase(input, '00', '0', '0');
        await testCase(input, '0,', '0,', '0');

        await testCase(input, ',67', '0,67', '0.67');
        await testCase(input, '.67', '0,67', '0.67');
        await testCase(input, '.,67', '0,67', '0.67');
        await testCase(input, ',.067', '0,067', '0.067');

        await testCase(input, '22 34,,67', '2\u00A0234,67', '1234.67');
        await testCase(input, '22 34,.67', '2\u00A0234,67', '1234.67');
        await testCase(input, '  2234,.67.231', '2\u00A0234,67231', '1234.67231');

        await testCase(input, '2,2,3', '2,23', '2.23');
        await testCase(input, '0,001,1,1', '0,00111', '0.00111');
        await testCase(input, '0,,5', '0,5', '0.5');

        await testCase(input, 'a', '', '');
        await testCase(input, '2234adf134', '2\u00A0234\u00A0134', '2234134');
    });

    test('Formats with the es locale', async () => {
        const input = renderInput('es-ES');

        await testCase(input, '32345,67', '32.345,67', '32345.67');
        await testCase(input, '3345.67', '3345,67', '3345.67');
        await testCase(input, '  32345.67  ', '32.345,67', '32345.67');

        await testCase(input, ',67', '0,67', '0.67');
        await testCase(input, '.67', '0,67', '0.67');
        await testCase(input, '.,67', '0,67', '0.67');
        await testCase(input, ',.067', '0,067', '0.067');

        await testCase(input, '32 34,,67', '3234,67', '3234.67');
        await testCase(input, '32 34,.67', '3234,67', '3234.67');
        await testCase(input, '  3234,.67.231', '3234,67231', '3234.67231');

        await testCase(input, 'a', '', '');
        await testCase(input, '3234adf134', '3.234.134', '3234134');
    });

    test('Formats a pasted value with consecutive decimal separators', async () => {
        const input = renderInput('en-US');

        await act(async () => {
            input.focus();
            await userEvent.paste('0..');
        });
        expect(input.value).toBe('0.');
        expect(onChangeMock).toHaveBeenCalledWith('0');
    });
});

describe('isExtraDecimalSeparator', () => {
    const inputState = (
        value: string,
        selectionStart = value.length,
        selectionEnd = value.length,
    ) => ({
        value,
        selectionStart,
        selectionEnd,
    });

    test('rejects a second decimal separator', () => {
        expect(isExtraDecimalSeparator('.', 'en-US', inputState('0.001'))).toBe(true);
        expect(isExtraDecimalSeparator(',', 'en-US', inputState('0.001'))).toBe(true);
        expect(isExtraDecimalSeparator('.', 'en-US', inputState('1,234.'))).toBe(true);
        expect(isExtraDecimalSeparator(',', 'cs-CZ', inputState('0,001'))).toBe(true);
        expect(isExtraDecimalSeparator('.', 'cs-CZ', inputState('0,001'))).toBe(true);
        expect(isExtraDecimalSeparator(',', 'es-ES', inputState('32.345,67'))).toBe(true);
    });

    test('allows the first decimal separator', () => {
        expect(isExtraDecimalSeparator('.', 'en-US', inputState(''))).toBe(false);
        expect(isExtraDecimalSeparator('.', 'en-US', inputState('1,234'))).toBe(false);
        expect(isExtraDecimalSeparator(',', 'en-US', inputState('1,234'))).toBe(false);
        expect(isExtraDecimalSeparator(',', 'cs-CZ', inputState('2\u00A0234'))).toBe(false);
        expect(isExtraDecimalSeparator(',', 'es-ES', inputState('32.345'))).toBe(false);
    });

    test('allows a separator replacing a selection containing one', () => {
        expect(isExtraDecimalSeparator('.', 'en-US', inputState('1.5', 0, 3))).toBe(false);
        expect(isExtraDecimalSeparator('.', 'en-US', inputState('1.5', 1, 2))).toBe(false);
    });

    test('ignores digits', () => {
        expect(isExtraDecimalSeparator('5', 'en-US', inputState('0.001'))).toBe(false);
    });
});
