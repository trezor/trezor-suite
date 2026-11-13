import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { Select } from './Select';
import { intermediaryTheme } from '../../../config/colors';

const options = [
    { label: 'Low', value: 'low' },
    { label: 'High', value: 'high' },
];

const pressWithMouse = (element: HTMLElement) => {
    fireEvent.pointerDown(element);
    fireEvent.mouseDown(element);
    act(() => element.focus());
};

describe('Select pressed while react-select loads', () => {
    // Load the react-select part up front, as in Select.test.tsx: its first evaluation is slow on CI.
    beforeAll(() => import('./SelectInner'), 30_000);

    /**
     * React-select is lazy only until the first Select in this file loads it,
     * so every press happens in one render, before it loads.
     */
    it('opens the last pressed select that kept focus, and drops presses that lost it', async () => {
        const onMenuOpen = jest.fn();
        const onMenuOpenDropped = jest.fn();

        render(
            <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
                <Select data-testid="@blurred" options={options} onMenuOpen={onMenuOpenDropped} />
                <Select data-testid="@scrolled" options={options} onMenuOpen={onMenuOpenDropped} />
                <Select
                    data-testid="@pressed"
                    options={options}
                    openMenuOnFocus={false}
                    onMenuOpen={onMenuOpen}
                />
                <Select data-testid="@disabled" options={options} isDisabled />
            </ThemeProvider>,
        );

        expect(screen.queryByTestId('@pressed/input')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@disabled/loading')).not.toBeInTheDocument();

        pressWithMouse(screen.getByTestId('@blurred/loading'));
        // A touch that turns into a scroll gets no mousedown and never focuses the control.
        fireEvent.pointerDown(screen.getByTestId('@scrolled/loading'));
        fireEvent.pointerCancel(screen.getByTestId('@scrolled/loading'));
        // Moves the focus away from the first one.
        pressWithMouse(screen.getByTestId('@pressed/loading'));

        expect(await screen.findByTestId('@pressed/option/high')).toBeInTheDocument();
        expect(within(screen.getByTestId('@pressed/input')).getByRole('combobox')).toHaveFocus();
        expect(onMenuOpen).toHaveBeenCalledTimes(1);

        expect(screen.queryByTestId('@pressed/loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('@blurred/input')).toBeInTheDocument();
        expect(screen.queryByTestId('@blurred/option/high')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@scrolled/option/high')).not.toBeInTheDocument();
        expect(onMenuOpenDropped).not.toHaveBeenCalled();
    });
});
