import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { Button } from './Button';
import { intermediaryTheme } from '../../../config/colors';

const renderWithTheme = (children: ReactNode) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            {children}
        </ThemeProvider>,
    );

describe('Button', () => {
    it('reports hover, which is what lets an opener fetch before it is clicked', async () => {
        const onMouseEnter = jest.fn();
        renderWithTheme(<Button onMouseEnter={onMouseEnter}>Open</Button>);

        await userEvent.hover(screen.getByRole('button'));

        expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('reports focus, so reaching a button by keyboard counts as the same intent', async () => {
        const onFocus = jest.fn();
        renderWithTheme(<Button onFocus={onFocus}>Open</Button>);

        await userEvent.tab();

        expect(screen.getByRole('button')).toHaveFocus();
        expect(onFocus).toHaveBeenCalledTimes(1);
    });
});
