import React from 'react';
import { useTheme } from '@trezor/components';
import { FormattedDate } from 'react-intl';
import { GraphRange } from '@wallet-types/graph';

interface CustomXAxisProps {
    selectedRange: GraphRange;
    [k: string]: any;
}

const getFormattedDate = (range: GraphRange['label'], date: Date) => {
    switch (range) {
        case 'all':
            return <FormattedDate value={date} month="short" year="numeric" />;
        case 'year':
            return <FormattedDate value={date} month="short" />;
        case 'month':
            return <FormattedDate value={date} day="2-digit" month="short" />;
        case 'week':
            return <FormattedDate value={date} weekday="short" />;
        // no default
    }
};

const CustomXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, payload } = props;
    const date = new Date(0);
    date.setUTCSeconds(payload.value);
    const theme = useTheme();

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
                {date && getFormattedDate(props.selectedRange.label, date)}
            </text>
        </g>
    );
};

export default CustomXAxisTick;
