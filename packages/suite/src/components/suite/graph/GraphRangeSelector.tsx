import { useRef, useState } from 'react';

import {
    differenceInMonths,
    endOfToday,
    startOfDay,
    startOfToday,
    subDays,
    subMonths,
    subYears,
} from 'date-fns';
import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import {
    Popover,
    type PopoverPlacement,
    type PopoverRef,
    Row,
    Timerange,
} from '@trezor/components';
import { typography } from '@trezor/theme';

import { useGraph, useLocales } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

const RangeItem = styled.div<{ $selected: boolean; $separated?: boolean }>`
    display: flex;
    ${({ $selected }) => ($selected ? typography['body-sm-strong'] : typography['body-sm'])}
    text-align: center;
    color: ${({ theme, $selected }) => ($selected ? theme.textDefault : theme.textSubdued)};
    cursor: pointer;
    text-transform: uppercase;
    font-variant-numeric: tabular-nums;

    & + & {
        margin-left: 12px;
    }

    &:hover {
        color: ${({ theme }) => theme.textDefault};
    }

    ${({ $separated }) =>
        $separated &&
        css`
            border-left: 1px solid ${({ theme }) => theme.borderElevation2};
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
    placement?: PopoverPlacement;
}

export const GraphRangeSelector = ({ onSelectedRange, placement }: GraphRangeSelectorProps) => {
    const [customTimerangeStart, setCustomTimerangeStart] = useState<Date>();
    const [customTimerangeEnd, setCustomTimerangeEnd] = useState<Date>();

    const popoverRef = useRef<PopoverRef>(undefined);
    const locale = useLocales();
    const { selectedRange, setSelectedRange } = useGraph();

    const clearCustomTimerange = () => {
        setCustomTimerangeStart(undefined);
        setCustomTimerangeEnd(undefined);
    };

    const setCustomTimerange = (startDate: Date, endDate: Date) => {
        setCustomTimerangeStart(startDate);
        setCustomTimerangeEnd(endDate);

        popoverRef.current!.close();

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
        <Row>
            {RANGES.map(range => (
                <RangeItem
                    key={range.label}
                    $selected={range.label === selectedRange.label}
                    onClick={() => {
                        setSelectedRange(range);
                        if (onSelectedRange) {
                            onSelectedRange(range);
                        }
                        clearCustomTimerange();
                    }}
                    data-testid={`@dashboard/graph/range-${range.label}`}
                >
                    {getFormattedLabel(range.label)}
                </RangeItem>
            ))}
            <Popover
                ref={popoverRef}
                placement={placement}
                content={
                    <Timerange
                        onSubmit={(startDate: Date, endDate: Date) =>
                            setCustomTimerange(startDate, endDate)
                        }
                        startDate={customTimerangeStart}
                        endDate={customTimerangeEnd}
                        onCancel={() => popoverRef.current!.close()}
                        ctaSubmit={<Translation id="TR_CONFIRM" />}
                        ctaCancel={<Translation id="TR_CANCEL" />}
                        locale={locale}
                    />
                }
            >
                <RangeItem $selected={selectedRange.label === 'range'} $separated>
                    <Translation id="TR_RANGE" />
                </RangeItem>
            </Popover>
        </Row>
    );
};
