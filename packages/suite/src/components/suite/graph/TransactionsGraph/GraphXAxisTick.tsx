import { FormattedDate } from 'react-intl';

import { useTheme } from 'styled-components';

import { exhaustive } from '@trezor/type-utils';

import { type GraphRange } from 'src/types/wallet/graph';

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
        case 'hour':
            return <FormattedDate value={date} weekday="short" />;
        case 'range':
            if (range.groupBy === 'day') {
                return <FormattedDate value={date} day="2-digit" month="short" />;
            }

            return <FormattedDate value={date} month="short" year="numeric" />;
        default:
            return exhaustive(range);
    }
};

interface GraphXAxisProps {
    selectedRange: GraphRange;
    payload?: {
        value: number;
    };
    x?: number;
    y?: number;
}

export const GraphXAxisTick = ({ x = 0, y = 0, payload, selectedRange }: GraphXAxisProps) => {
    const theme = useTheme();

    if (!payload) return null;

    const date = new Date(0);
    date.setUTCSeconds(payload.value);

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill={theme.contentSecondary}
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {getFormattedDate(selectedRange, date)}
            </text>
        </g>
    );
};
