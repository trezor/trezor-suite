import { type ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { Dropdown } from './Dropdown';
import { intermediaryTheme } from '../../config/colors';

const renderWithTheme = (children: ReactNode) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            {children}
        </ThemeProvider>,
    );

describe('Dropdown', () => {
    // `Popover` owns the open state and only populates the ref it is given during commit, so
    // nothing re-renders `Dropdown` between mount and the first time the menu is opened. Reading
    // that ref during render therefore left `Menu` without an `onClose` until some unrelated
    // re-render happened to come along, and picking an item silently did nothing.
    it('closes the menu when an item is picked on the very first open', async () => {
        const onClick = jest.fn();

        renderWithTheme(
            <Dropdown
                data-testid="@dropdown"
                items={[{ label: 'Export as .csv', onClick, 'data-testid': '@dropdown/csv' }]}
            />,
        );

        await userEvent.click(screen.getByTestId('@dropdown'));
        await userEvent.click(await screen.findByTestId('@dropdown/csv'));

        expect(onClick).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByTestId('@dropdown/csv')).not.toBeInTheDocument());
    });

    it('keeps the menu open when an item opts out of closing', async () => {
        renderWithTheme(
            <Dropdown
                data-testid="@dropdown"
                items={[
                    {
                        label: 'Toggle something',
                        closeOnClick: false,
                        'data-testid': '@dropdown/toggle',
                    },
                ]}
            />,
        );

        await userEvent.click(screen.getByTestId('@dropdown'));
        await userEvent.click(await screen.findByTestId('@dropdown/toggle'));

        expect(screen.getByTestId('@dropdown/toggle')).toBeInTheDocument();
    });
});
