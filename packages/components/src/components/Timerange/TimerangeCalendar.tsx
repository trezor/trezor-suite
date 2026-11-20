import { DateRange } from 'react-date-range';

import type { Locale } from 'date-fns';

type Selection = {
    key: string;
    startDate: Date;
    endDate: Date;
};

export type TimerangeSelection = {
    selection: Selection;
};

export type TimerangeCalendarProps = {
    range: {
        key: string;
        startDate: Date | null;
        endDate: Date;
    };
    maxDate: Date;
    locale?: Locale;
    onChange: (selection: Selection) => void;
};

export const TimerangeCalendar = ({ range, maxDate, locale, onChange }: TimerangeCalendarProps) => (
    <DateRange
        editableDateInputs
        onChange={(item: TimerangeSelection) => onChange(item.selection)}
        moveRangeOnFirstSelection={false}
        maxDate={maxDate}
        ranges={[range]}
        startDatePlaceholder=""
        endDatePlaceholder=""
        locale={locale}
    />
);
