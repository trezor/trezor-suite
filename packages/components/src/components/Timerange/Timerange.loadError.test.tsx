import { act, render, screen } from '@testing-library/react';
import type { Locale } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ThemeProvider } from 'styled-components';

import { Timerange } from './Timerange';
import { intermediaryTheme } from '../../config/colors';

let mockLoadAttempts = 0;

const settleLoad = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

jest.mock('./TimerangeCalendar', () => {
    mockLoadAttempts++;
    throw new Error('Loading chunk failed');
});

const timerangeTree = ({
    onCancel = jest.fn(),
    ctaSubmit = 'Confirm',
    startDate,
    locale,
}: {
    onCancel?: () => void;
    ctaSubmit?: string;
    startDate?: Date;
    locale?: Locale;
} = {}) => (
    <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
        <Timerange
            onSubmit={jest.fn()}
            onCancel={onCancel}
            startDate={startDate}
            locale={locale}
            ctaCancel="Cancel"
            ctaSubmit={ctaSubmit}
        />
    </ThemeProvider>
);

describe('Timerange when react-date-range fails to load', () => {
    it('keeps the buttons, and the next Timerange loads again', async () => {
        const onCancel = jest.fn();
        const { unmount } = render(timerangeTree({ onCancel }));

        await settleLoad();
        expect(screen.queryByTestId('@spinner')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
        expect(mockLoadAttempts).toBe(1);

        act(() => screen.getByRole('button', { name: 'Cancel' }).click());
        expect(onCancel).toHaveBeenCalledTimes(1);

        unmount();
        render(timerangeTree());
        await settleLoad();

        expect(mockLoadAttempts).toBe(2);
    });

    it('loads once per mount, however often it re-renders', async () => {
        const attemptsBefore = mockLoadAttempts;
        const { rerender } = render(timerangeTree());
        await settleLoad();

        for (const ctaSubmit of ['Apply 1', 'Apply 2', 'Apply 3']) {
            rerender(timerangeTree({ ctaSubmit }));
            await settleLoad();
        }

        expect(screen.getByRole('button', { name: 'Apply 3' })).toBeDisabled();
        expect(mockLoadAttempts - attemptsBefore).toBe(1);
    });

    it.each([
        { month: 'November 2026, Sunday first', startDate: new Date(2026, 10, 2), height: '347px' },
        {
            month: 'November 2026, Monday first',
            startDate: new Date(2026, 10, 2),
            locale: cs,
            height: '389px',
        },
        {
            month: 'February 2027, Monday first',
            startDate: new Date(2027, 1, 2),
            locale: cs,
            height: '305px',
        },
    ])(
        'keeps the height of $month while loading and after the failure',
        async ({ height, ...props }) => {
            render(timerangeTree(props));
            const loadingPlaceholder = screen.getByTestId('@spinner').parentElement;
            const calendarArea = loadingPlaceholder?.parentElement;

            expect(loadingPlaceholder).toHaveStyle({ height });

            await settleLoad();
            expect(screen.queryByTestId('@spinner')).not.toBeInTheDocument();
            expect(calendarArea?.firstElementChild).toHaveStyle({ height });
        },
    );
});
