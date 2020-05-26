import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { GraphRange } from '@suite/types/wallet/fiatRates';

const Wrapper = styled.div`
    display: flex;
    margin-bottom: 8px;
`;

const RangeItem = styled.div<{ selected: boolean }>`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: center;
    color: ${props => (props.selected ? colors.BLACK0 : colors.BLACK50)};
    cursor: pointer;

    & + & {
        margin-left: 20px;
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
    selectedRange: GraphRange | null;
    onSelectedRange: (range: GraphRange) => void;
}

const RangeSelector = (props: Props) => {
    return (
        <Wrapper>
            {RANGES.map(range => (
                <RangeItem
                    key={range.label}
                    selected={range.weeks === props.selectedRange?.weeks}
                    onClick={() => {
                        props.onSelectedRange(range);
                    }}
                >
                    {range.label}
                </RangeItem>
            ))}
        </Wrapper>
    );
};

export default RangeSelector;
