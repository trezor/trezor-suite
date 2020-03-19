import React from 'react';
import { FormattedDate } from 'react-intl';
import { getDateWithTimeZone } from '@suite/utils/suite/date';

interface Range {
    label: string;
    weeks: number;
}

interface CustomXAxisProps {
    selectedRange: Range;
    [k: string]: any;
}

const CustomXAxisTick = (props: CustomXAxisProps) => {
    const { x, y, payload } = props;
    const date = getDateWithTimeZone(payload.value * 1000);
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-50)">
                {date && props.selectedRange?.label === 'year' && (
                    <FormattedDate value={date} month="2-digit" year="numeric" />
                )}
                {date && props.selectedRange?.label !== 'year' && (
                    <FormattedDate value={date} day="2-digit" month="2-digit" />
                )}
            </text>
        </g>
    );
};

export default CustomXAxisTick;
