import React from 'react';
import { useTheme } from '@trezor/components';
import { FormattedDate } from 'react-intl';
import { GraphRange } from '@wallet-types/graph';
import { differenceInMonths } from 'date-fns';

interface CustomXAxisProps {
    selectedRange: GraphRange;
    [k: string]: any;
}

const getFormattedDate = (range: GraphRange, date: Date) => {
    switch (range.label) {
        case 'all':
            return <FormattedDate value={date} month="short" year="numeric" />;
        case 'year':
            return <FormattedDate value={date} month="short" />;
        case 'month':
            return <FormattedDate value={date} day="2-digit" month="short" />;
        case 'week':
        case 'day':
            return <FormattedDate value={date} weekday="short" />;
        case 'range':
            if (differenceInMonths(range.endDate, range.startDate) <= 1) {
                return <FormattedDate value={date} day="2-digit" month="short" />;
            }
            return <FormattedDate value={date} month="short" year="numeric" />;
        // no default
    }
};

export const CustomXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, payload } = props;

    const theme = useTheme();

    const date = new Date(0);
    date.setUTCSeconds(payload.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill={theme.TYPE_LIGHT_GREY}
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {date && getFormattedDate(props.selectedRange, date)}
            </text>
        </g>
    );
};
