import { useTheme } from 'styled-components';
import { FormattedDate } from 'react-intl';

import { differenceInMonths } from 'date-fns';
import { GraphRange } from 'src/types/wallet/graph';

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

interface GraphXAxisProps {
    selectedRange: GraphRange;
    [k: string]: any;
}

export const GraphXAxisTick = ({ x, y, payload, selectedRange }: GraphXAxisProps) => {
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
                {date && getFormattedDate(selectedRange, date)}
            </text>
        </g>
    );
};
