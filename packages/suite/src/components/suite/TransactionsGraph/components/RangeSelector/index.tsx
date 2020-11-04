import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useGraph } from '@suite-hooks';
import { GraphRange } from '@wallet-types/graph';
import { getFormattedLabel } from '@wallet-utils/graphUtils';

const Wrapper = styled.div`
    display: flex;
    /* margin-bottom: 8px; */
`;

const RangeItem = styled.div<{ selected: boolean }>`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    font-weight: ${props => (props.selected ? 600 : 500)};
    color: ${props => (props.selected ? props.theme.TYPE_DARK_GREY : props.theme.TYPE_LIGHT_GREY)};
    cursor: pointer;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;

    & + & {
        margin-left: 12px;
    }
`;

const RANGES = [
    {
        label: 'week',
        weeks: 1,
        groupBy: 'day',
    },
    {
        label: 'month',
        weeks: 4,
        groupBy: 'day',
    },
    {
        label: 'year',
        weeks: 52,
        groupBy: 'month',
    },
    {
        label: 'all',
        weeks: null,
        groupBy: 'month',
    },
] as const;

interface Props {
    onSelectedRange?: (range: GraphRange) => void;
    className?: string;
}

const RangeSelector = (props: Props) => {
    const { selectedRange, setSelectedRange } = useGraph();

    return (
        <Wrapper className={props.className}>
            {RANGES.map(range => (
                <RangeItem
                    key={range.label}
                    selected={range.weeks === selectedRange?.weeks}
                    onClick={() => {
                        setSelectedRange(range);
                        if (props.onSelectedRange) {
                            props.onSelectedRange(range);
                        }
                    }}
                >
                    {getFormattedLabel(range.label)}
                </RangeItem>
            ))}
        </Wrapper>
    );
};

export default RangeSelector;
