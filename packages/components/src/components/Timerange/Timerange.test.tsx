import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cs } from 'date-fns/locale';
import { ThemeProvider } from 'styled-components';

import { Timerange, type TimerangeProps } from './Timerange';
import { getCalendarWeekRows } from './utils';
import { intermediaryTheme } from '../../config/colors';

const renderTimerange = (props: Partial<TimerangeProps> = {}) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <Timerange
                onSubmit={jest.fn()}
                onCancel={jest.fn()}
                startDate={new Date(2024, 0, 10)}
                endDate={new Date(2024, 0, 20)}
                ctaCancel="Cancel"
                ctaSubmit="Confirm"
                {...props}
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

    /**
     * jsdom lays nothing out, so the calendar's height in px cannot be compared here. Its CSS and the
     * placeholder share their sizes (./utils), and this checks the part that varies: the week rows.
     */
    it.each([
        { month: 'November 2026, Sunday first', date: new Date(2026, 10, 2), weekRows: 5 },
        {
            month: 'November 2026, Monday first',
            date: new Date(2026, 10, 2),
            locale: cs,
            weekRows: 6,
        },
        {
            month: 'February 2027, Monday first',
            date: new Date(2027, 1, 2),
            locale: cs,
            weekRows: 4,
        },
    ])(
        'shows the $weekRows week rows of $month its placeholder is sized for',
        async ({ date, locale, weekRows }) => {
            const { container } = renderTimerange({ startDate: date, endDate: date, locale });

            await waitFor(() => expect(container.querySelector('.rdrDays')).toBeInTheDocument());
            const days = container.querySelectorAll('.rdrDays .rdrDay');

            expect(days.length / 7).toBe(weekRows);
            expect(getCalendarWeekRows(date, locale)).toBe(weekRows);
        },
    );
});
