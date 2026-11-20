import type { Locale } from 'date-fns';

/**
 * The calendar's heights in px. The calendar's CSS in Timerange.tsx sets each of them and getCalendarHeight
 * adds them up, so the loading and failed-load placeholders stay as tall as the calendar.
 */
export const DATE_DISPLAY_HEIGHT = 26;
export const DATE_DISPLAY_PADDING_BOTTOM = 12;
export const DATE_DISPLAY_BORDER_WIDTH = 1;
export const MONTH_AND_YEAR_HEIGHT = 50;
export const WEEK_DAYS_HEIGHT = 36;
export const MONTH_PADDING_BOTTOM = 12;
export const WEEK_ROW_HEIGHT = 42;

/**
 * The week rows react-date-range shows for the month the calendar opens on (the range start, else today):
 * 4 to 6, depending on the locale's first day of the week.
 */
export const getCalendarWeekRows = (startDate: Date | null, locale?: Locale) => {
    const shownMonth = startDate ?? new Date();
    const year = shownMonth.getFullYear();
    const month = shownMonth.getMonth();
    const weekStartsOn = locale?.options?.weekStartsOn ?? 0;
    const leadingDays = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Math.ceil((leadingDays + daysInMonth) / 7);
};

/**
 * The calendar's height for the month it opens on, so the popover keeps its size when the calendar
 * replaces the placeholder.
 */
export const getCalendarHeight = (startDate: Date | null, locale?: Locale) =>
    DATE_DISPLAY_HEIGHT +
    DATE_DISPLAY_PADDING_BOTTOM +
    DATE_DISPLAY_BORDER_WIDTH +
    MONTH_AND_YEAR_HEIGHT +
    WEEK_DAYS_HEIGHT +
    MONTH_PADDING_BOTTOM +
    getCalendarWeekRows(startDate, locale) * WEEK_ROW_HEIGHT;
