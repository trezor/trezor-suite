import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { PinInput, type PinInputProps } from './PinInput';
import { intermediaryTheme } from '../../config/colors';

const renderPinInput = (props: PinInputProps) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <PinInput {...props} />
        </ThemeProvider>,
    );

const getInput = (index: number) => {
    const input = screen.getAllByRole('textbox')[index];

    if (input === undefined) {
        throw new Error(`PIN input at index ${index} was not rendered.`);
    }

    return input;
};

describe('PinInput', () => {
    it.each([
        { layout: 'Czech', keys: '+ěščřžýáíé' },
        { layout: 'English/German', keys: '1234567890' },
    ])('enters the number row on a $layout keyboard', async ({ keys }) => {
        const user = userEvent.setup({
            keyboardMap: Array.from(keys, (key, index) => ({
                key,
                code: `Digit${'1234567890'[index]}`,
            })),
        });
        const onComplete = jest.fn();
        const onChange = jest.fn();
        renderPinInput({ length: 10, onComplete, onChange });
        const inputs = screen.getAllByRole('textbox');

        await user.click(getInput(0));
        await user.keyboard(keys);

        inputs.forEach((element, index) => {
            expect(element).toHaveValue('1234567890'[index]);
        });
        expect(getInput(9)).toHaveFocus();
        expect(onChange).toHaveBeenLastCalledWith('1234567890');
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('1234567890');
    });

    it('accepts a shifted number-row key when replacing an existing digit', () => {
        const onComplete = jest.fn();
        renderPinInput({ length: 2, defaultCode: '12', onComplete });

        fireEvent.keyDown(getInput(0), { key: '"', code: 'Digit2', shiftKey: true });

        expect(getInput(0)).toHaveValue('2');
        expect(getInput(1)).toHaveFocus();
        expect(onComplete).toHaveBeenLastCalledWith('22');
    });

    it('preserves a digit produced by a remapped number-row key', () => {
        const onComplete = jest.fn();
        renderPinInput({ length: 1, onComplete });

        fireEvent.keyDown(screen.getByRole('textbox'), { key: '9', code: 'Digit2' });

        expect(onComplete).toHaveBeenCalledWith('9');
    });

    it('accepts numeric input without physical key codes', () => {
        const onComplete = jest.fn();
        renderPinInput({ length: 2, onComplete });

        fireEvent.change(getInput(0), { target: { value: '1' } });
        fireEvent.change(getInput(1), { target: { value: '2' } });

        expect(onComplete).toHaveBeenCalledWith('12');
    });

    it('accepts numpad input', async () => {
        const user = userEvent.setup({
            keyboardMap: [
                { key: '1', code: 'Numpad1', location: 3 },
                { key: '2', code: 'Numpad2', location: 3 },
            ],
        });
        const onComplete = jest.fn();
        renderPinInput({ length: 2, onComplete });

        await user.click(getInput(0));
        await user.keyboard('[Numpad1][Numpad2]');

        expect(onComplete).toHaveBeenCalledWith('12');
    });

    it.each([{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true }])(
        'does not intercept a number-row key with %o',
        modifiers => {
            const onComplete = jest.fn();
            renderPinInput({ length: 1, onComplete });
            const input = screen.getByRole('textbox');

            const wasNotPrevented = fireEvent.keyDown(input, {
                key: 'ě',
                code: 'Digit2',
                ...modifiers,
            });

            expect(wasNotPrevented).toBe(true);
            expect(input).toHaveValue('');
            expect(onComplete).not.toHaveBeenCalled();
        },
    );

    it('ignores non-numeric characters from keys outside the number row', async () => {
        const user = userEvent.setup();
        const onComplete = jest.fn();
        renderPinInput({ length: 2, onComplete });

        await user.click(getInput(0));
        await user.keyboard('abc+');

        expect(getInput(0)).toHaveValue('');
        expect(getInput(0)).toHaveFocus();
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('ignores number-row input while disabled', () => {
        const onComplete = jest.fn();
        renderPinInput({ length: 2, isDisabled: true, onComplete });

        fireEvent.keyDown(getInput(0), { key: '+', code: 'Digit1' });

        expect(getInput(0)).toHaveValue('');
        expect(getInput(1)).toHaveValue('');
        expect(onComplete).not.toHaveBeenCalled();
    });
});
