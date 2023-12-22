import { useState, useRef } from 'react';

import styled, { css } from 'styled-components';
import { Translation } from 'src/components/suite';
import { useGraph, useLocales } from 'src/hooks/suite';
import {
    startOfDay,
    startOfToday,
    endOfToday,
    subDays,
    subMonths,
    subYears,
    differenceInMonths,
} from 'date-fns';

import { colors, variables, Dropdown, DropdownRef, Timerange } from '@trezor/components';
import { GraphRange } from 'src/types/wallet/graph';

const Wrapper = styled.div`
    display: flex;
`;

const RangeItem = styled.div<{ selected: boolean; separated?: boolean }>`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
    font-weight: ${({ selected }) => (selected ? 600 : 500)};
    color: ${({ theme, selected }) => (selected ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY)};
    cursor: pointer;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;

    :hover {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    & + & {
        margin-left: 12px;
    }

    ${({ separated }) =>
        separated &&
        css`
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

const getFormattedLabel = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'range':
            return <Translation id="TR_RANGE" />;
        case 'all':
            return <Translation id="TR_ALL" />;
        case 'year':
            return <Translation id="TR_DATE_YEAR_SHORT" />;
        case 'month':
            return <Translation id="TR_DATE_MONTH_SHORT" />;
        case 'week':
            return <Translation id="TR_DATE_WEEK_SHORT" />;
        case 'day':
            return <Translation id="TR_DATE_DAY_SHORT" />;
        // no default
    }
};

interface GraphRangeSelectorProps {
    onSelectedRange?: (range: GraphRange) => void;
    className?: string;
    align?: 'bottom-left' | 'bottom-right';
}

export const GraphRangeSelector = ({
    onSelectedRange,
    className,
    align,
}: GraphRangeSelectorProps) => {
    const [customTimerangeStart, setCustomTimerangeStart] = useState<Date>();
    const [customTimerangeEnd, setCustomTimerangeEnd] = useState<Date>();

    const dropdownRef = useRef<DropdownRef>();
    const locale = useLocales();
    const { selectedRange, setSelectedRange } = useGraph();

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
        <Wrapper className={className}>
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
                alignMenu={align}
                content={
                    <Timerange
                        onSubmit={(startDate: Date, endDate: Date) =>
                            setCustomTimerange(startDate, endDate)
                        }
                        startDate={customTimerangeStart}
                        endDate={customTimerangeEnd}
                        onCancel={() => dropdownRef.current!.close()}
                        ctaSubmit={<Translation id="TR_CONFIRM" />}
                        ctaCancel={<Translation id="TR_CANCEL" />}
                        locale={locale}
                    />
                }
            >
                <RangeItem selected={selectedRange.label === 'range'} separated>
                    <Translation id="TR_RANGE" />
                </RangeItem>
            </Dropdown>
        </Wrapper>
    );
};
