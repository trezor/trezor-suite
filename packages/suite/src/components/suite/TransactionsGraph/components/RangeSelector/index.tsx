import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { colors, variables, Dropdown, DropdownRef, Timerange } from '@trezor/components';
import { Translation } from '@suite-components';
import { useGraph } from '@suite-hooks';
import { GraphRange } from '@wallet-types/graph';
import { getFormattedLabel } from '@wallet-utils/graphUtils';
import {
    startOfDay,
    startOfToday,
    endOfToday,
    subDays,
    subMonths,
    subYears,
    differenceInMonths,
} from 'date-fns';

const Wrapper = styled.div`
    display: flex;
    /* margin-bottom: 8px; */
`;

const RangeItem = styled.div<{ selected: boolean; separated?: boolean }>`
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

    ${props =>
        props.separated &&
        `
        border-left: 1px solid ${colors.TYPE_LIGHTER_GREY};
        padding-left: 15px;
        margin-left: 15px;
        text-transform: capitalize;
    `};
`;

const END_OF_TODAY = endOfToday();
const RANGES = [
    {
        label: 'day',
        startDate: startOfToday(),
        endDate: END_OF_TODAY,
        groupBy: 'day',
    },
    {
        label: 'week',
        startDate: startOfDay(subDays(END_OF_TODAY, 7)),
        endDate: END_OF_TODAY,
        groupBy: 'day',
    },
    {
        label: 'month',
        startDate: startOfDay(subMonths(END_OF_TODAY, 1)),
        endDate: END_OF_TODAY,
        groupBy: 'day',
    },
    {
        label: 'year',
        startDate: startOfDay(subYears(END_OF_TODAY, 1)),
        endDate: END_OF_TODAY,
        groupBy: 'month',
    },
    {
        label: 'all',
        startDate: null,
        endDate: null,
        groupBy: 'month',
    },
] as const;

interface Props {
    onSelectedRange?: (range: GraphRange) => void;
    className?: string;
    align?: 'left' | 'right';
}

const RangeSelector = (props: Props) => {
    const dropdownRef = useRef<DropdownRef>();
    const { onSelectedRange } = props;
    const { selectedRange, setSelectedRange } = useGraph();
    const [customTimerangeStart, setCustomTimerangeStart] = useState<Date>();
    const [customTimerangeEnd, setCustomTimerangeEnd] = useState<Date>();
    const setCustomTimerange = (startDate: Date, endDate: Date) => {
        setCustomTimerangeStart(startDate);
        setCustomTimerangeEnd(endDate);
        dropdownRef.current!.close();
        const range: GraphRange = {
            label: 'range',
            startDate,
            endDate,
            groupBy: differenceInMonths(startDate, endDate) <= 1 ? 'day' : 'month',
        };
        setSelectedRange(range);
        if (onSelectedRange) {
            onSelectedRange(range);
        }
    };

    return (
        <Wrapper className={props.className}>
            {RANGES.map(range => (
                <RangeItem
                    key={range.label}
                    selected={range.label === selectedRange.label}
                    onClick={() => {
                        setSelectedRange(range);
                        if (onSelectedRange) {
                            onSelectedRange(range);
                        }
                    }}
                >
                    {getFormattedLabel(range.label)}
                </RangeItem>
            ))}
            <Dropdown
                ref={dropdownRef}
                topPadding={0}
                bottomPadding={0}
                alignMenu={props.align}
                items={[
                    {
                        key: 'dropdown',
                        options: [
                            {
                                noPadding: true,
                                noHover: true,
                                key: 'timerange',
                                label: (
                                    <Timerange
                                        onSubmit={(startDate: Date, endDate: Date) =>
                                            setCustomTimerange(startDate, endDate)
                                        }
                                        startDate={customTimerangeStart}
                                        endDate={customTimerangeEnd}
                                        onCancel={() => dropdownRef.current!.close()}
                                        ctaSubmit={<Translation id="TR_CONFIRM" />}
                                        ctaCancel={<Translation id="TR_CANCEL" />}
                                    />
                                ),
                                callback: () => false,
                            },
                        ],
                    },
                ]}
            >
                <RangeItem selected={selectedRange.label === 'range'} separated>
                    <Translation id="TR_RANGE" />
                </RangeItem>
            </Dropdown>
        </Wrapper>
    );
};

export default RangeSelector;
