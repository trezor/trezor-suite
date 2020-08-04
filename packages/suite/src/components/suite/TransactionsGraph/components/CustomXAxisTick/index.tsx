import React from 'react';
import { colors } from '@trezor/components';
import { FormattedDate } from 'react-intl';
import { GraphRange } from '@wallet-types/graph';

interface CustomXAxisProps {
    selectedRange: GraphRange;
    [k: string]: any;
}

const getFormattedDate = (range: GraphRange['label'], date: Date) => {
    switch (range) {
        case 'all':
            return <FormattedDate value={date} month="2-digit" year="numeric" />;
        case 'year':
            return <FormattedDate value={date} month="2-digit" year="numeric" />;
        case 'month':
            return <FormattedDate value={date} day="2-digit" month="2-digit" />;
        case 'week':
            return <FormattedDate value={date} weekday="short" />;
        // no default
    }
};

const CustomXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, payload } = props;
    const date = new Date(0);
    date.setUTCSeconds(payload.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="end"
                fill={colors.NEUE_TYPE_LIGHT_GREY}
                transform="rotate(-50)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {date && getFormattedDate(props.selectedRange.label, date)}
            </text>
        </g>
    );
};

export default CustomXAxisTick;
