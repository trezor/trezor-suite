import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { Select, SelectOption } from './Select';
import { intermediaryTheme } from '../../../config/colors';

const options = [
    { label: 'Low', value: 'low' },
    { label: 'High', value: 'high' },
];

const renderWithTheme = (children: ReactNode) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            {children}
        </ThemeProvider>,
    );

describe('Select', () => {
    // Load the react-select part once up front: on a busy CI runner its first transform and evaluation
    // take seconds, and an import error fails here loudly instead of leaving the fallback on screen.
    beforeAll(() => import('./SelectInner'), 30_000);

    it('renders its form cell at once and the react-select control once that loads', async () => {
        const onChange = jest.fn();

        renderWithTheme(
            <Select
                data-testid="@select"
                bottomText="Pick a fee"
                options={options}
                onChange={onChange}
            />,
        );

        expect(screen.getByText('Pick a fee')).toBeInTheDocument();
        expect(screen.queryByTestId('@select/input')).not.toBeInTheDocument();

        await userEvent.click(await screen.findByTestId('@select/input'));
        await userEvent.click(await screen.findByTestId('@select/option/high'));

        expect(onChange).toHaveBeenCalledWith(
            options[1],
            expect.objectContaining({ clearValue: expect.any(Function) }),
        );
    });

    it('renders the default option inside a custom option component', async () => {
        renderWithTheme(
            <Select
                data-testid="@select"
                options={options}
                components={{
                    Option: props => (
                        <SelectOption {...props} size="small" data-testid="@custom">
                            <span>{props.children} (custom)</span>
                        </SelectOption>
                    ),
                }}
            />,
        );

        await userEvent.click(await screen.findByTestId('@select/input'));

        expect(await screen.findByTestId('@custom/option/high')).toHaveTextContent('High (custom)');
    });
});
