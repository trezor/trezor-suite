import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { Timerange } from './Timerange';
import { intermediaryTheme } from '../../config/colors';

const renderTimerange = (props: { onSubmit?: jest.Mock; onCancel?: jest.Mock } = {}) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <Timerange
                onSubmit={props.onSubmit ?? jest.fn()}
                onCancel={props.onCancel ?? jest.fn()}
                startDate={new Date(2024, 0, 10)}
                endDate={new Date(2024, 0, 20)}
                ctaCancel="Cancel"
                ctaSubmit="Confirm"
            />
        </ThemeProvider>,
    );

describe('Timerange', () => {
    beforeAll(async () => {
        // Warm the lazy calendar (react-date-range) so the first findBy does not race a cold transform.
        await import('./TimerangeCalendar');
    });

    it('shows a spinner until the calendar loads, then the selected range', async () => {
        renderTimerange();

        expect(screen.getByTestId('@spinner')).toBeInTheDocument();
        expect(await screen.findByDisplayValue('Jan 10, 2024')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jan 20, 2024')).toBeInTheDocument();
        expect(screen.queryByTestId('@spinner')).not.toBeInTheDocument();
    });

    it('submits the selected range', async () => {
        const onSubmit = jest.fn();
        renderTimerange({ onSubmit });

        await screen.findByDisplayValue('Jan 10, 2024');
        await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(onSubmit).toHaveBeenCalledWith(new Date(2024, 0, 10), new Date(2024, 0, 20));
    });
});
