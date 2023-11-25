import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import suiteReducer, { SuiteState } from 'src/reducers/suite/suiteReducer';
import { configureMockStore } from '@suite-common/test-utils';
import { ThemeProvider } from 'src/support/suite/ThemeProvider';
import { Locale } from 'src/config/suite/languages';
import { NumberInput } from '..';

const onChangeMock = jest.fn();

interface InputWithFormProps {
    store: Store;
}

const InputWithForm = ({ store }: InputWithFormProps) => {
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
                    testID="number-input"
                    onChange={onChangeMock}
                />
            </ThemeProvider>
        </Provider>
    );
};

const renderInput = (language: Locale) => {
    const store = configureMockStore({
        reducer: { suite: suiteReducer },
        preloadedState: { suite: { settings: { language } } as unknown as SuiteState },
    });

    const { getByTestId } = render(<InputWithForm store={store} />);
    const input = getByTestId('number-input') as HTMLInputElement;

    return input;
};

const testCase = async (
    element: HTMLInputElement,
    userInput: string,
    displayed: string,
    reported: string,
) => {
    // types userInput character by character
    await userEvent.type(element, userInput);

    expect(element.value).toBe(displayed);
    expect(onChangeMock).toHaveBeenCalledWith(reported);

    await userEvent.clear(element);
};

describe('NumberInput component', () => {
    test('Formats with the en locale', async () => {
        const input = renderInput('en');

        await testCase(input, '12345.67', '12,345.67', '12345.67');
        await testCase(input, '1234,67', '1,234.67', '1234.67');

        await testCase(input, ',67', '0.67', '0.67');
        await testCase(input, '.67', '0.67', '0.67');
        await testCase(input, '.,67', '0.67', '0.67');
        await testCase(input, ',.067', '0.067', '0.067');

        await testCase(input, '12 34,,67', '1,234.67', '1234.67');
        await testCase(input, '12 34,.67', '1,234.67', '1234.67');
        await testCase(input, '  1234,.67.231', '1,234.67231', '1234.67231');

        await testCase(input, 'a', '', '');
        await testCase(input, '1234adf134', '1,234,134', '1234134');
    });

    test('Formats with the cs locale', async () => {
        const input = renderInput('cs');

        await testCase(input, '22345.67', '22\u00A0345,67', '22345.67');
        await testCase(input, '2234,67', '2\u00A0234,67', '2234.67');

        await testCase(input, ',67', '0,67', '0.67');
        await testCase(input, '.67', '0,67', '0.67');
        await testCase(input, '.,67', '0,67', '0.67');
        await testCase(input, ',.067', '0,067', '0.067');

        await testCase(input, '22 34,,67', '2\u00A0234,67', '1234.67');
        await testCase(input, '22 34,.67', '2\u00A0234,67', '1234.67');
        await testCase(input, '  2234,.67.231', '2\u00A0234,67231', '1234.67231');

        await testCase(input, 'a', '', '');
        await testCase(input, '2234adf134', '2\u00A0234\u00A0134', '2234134');
    });

    test('Formats with the es locale', async () => {
        const input = renderInput('es');

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
});
