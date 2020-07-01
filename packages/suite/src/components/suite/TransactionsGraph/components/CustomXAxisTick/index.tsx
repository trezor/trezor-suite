import React from 'react';
import { FormattedDate } from 'react-intl';
import { GraphRange } from '@wallet-types/fiatRates';

interface CustomXAxisProps {
    selectedRange: GraphRange;
    [k: string]: any;
}

const CustomXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, payload } = props;
    const date = new Date(0);
    date.setUTCSeconds(payload.value);
    const showMMYYFormat =
        props.selectedRange?.label === 'year' || props.selectedRange?.label === 'all';
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="end"
                fill="#666"
                transform="rotate(-50)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {date && showMMYYFormat && (
                    <FormattedDate value={date} month="2-digit" year="numeric" />
                )}
                {date && !showMMYYFormat && (
                    <FormattedDate value={date} day="2-digit" month="2-digit" />
                )}
            </text>
        </g>
    );
};

export default CustomXAxisTick;
