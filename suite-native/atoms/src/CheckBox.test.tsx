import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';
import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

import { CheckBox } from './CheckBox';

const renderer = createRenderer();

describe.each(['standard', 'dark'] as const)('debug checkbox in %s theme', colorVariant => {
    const theme = prepareNativeTheme({ colorVariant });

    it('uses pink when checked and still toggles', async () => {
        const onChange = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <StylesProvider theme={theme} renderer={renderer}>
                <CheckBox intent="debug" isChecked onChange={onChange} />
            </StylesProvider>,
        );
        const checkbox = getByRole('checkbox');

        expect(checkbox).toHaveStyle({ backgroundColor: theme.colors.elementFillDebugBold });
        await fireEvent.press(checkbox);
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it('keeps the disabled appearance and cannot toggle', async () => {
        const onChange = jest.fn();
        const { getByRole } = await renderWithBasicProvider(
            <StylesProvider theme={theme} renderer={renderer}>
                <CheckBox intent="debug" isChecked isDisabled onChange={onChange} />
            </StylesProvider>,
        );
        const checkbox = getByRole('checkbox');

        expect(checkbox).toHaveStyle({
            backgroundColor: theme.colors.elementFillFieldSelectedDisabled,
        });
        await fireEvent.press(checkbox);
        expect(onChange).not.toHaveBeenCalled();
    });
});
