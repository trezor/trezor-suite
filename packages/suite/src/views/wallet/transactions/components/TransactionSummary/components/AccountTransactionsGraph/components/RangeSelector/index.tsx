import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

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
    },
    {
        label: 'month',
        weeks: 4,
    },
    {
        label: 'year',
        weeks: 52,
    },
];

interface Props {
    selectedRange: typeof RANGES[number] | null;
    onSelectedRange: (range: typeof RANGES[number]) => void;
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
