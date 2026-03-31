import { type ReactNode } from 'react';

import { endOfToday, startOfDay, subDays, subMonths, subYears } from 'date-fns';

import { Translation } from '@suite/intl';
import { Row, SelectBar, Spinner, Tooltip } from '@trezor/components';

import { useGraph } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

const getRanges = () => {
    const now = new Date();
    const endOfCurrentDay = endOfToday();

    return [
        {
            label: 'day',
            startDate: startOfDay(now),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'week',
            startDate: startOfDay(subDays(endOfCurrentDay, 7)),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'month',
            startDate: startOfDay(subMonths(endOfCurrentDay, 1)),
            endDate: endOfCurrentDay,
            groupBy: 'day',
        },
        {
            label: 'year',
            startDate: startOfDay(subYears(endOfCurrentDay, 1)),
            endDate: endOfCurrentDay,
            groupBy: 'month',
        },
        {
            label: 'all',
            startDate: null,
            endDate: null,
            groupBy: 'month',
        },
    ] as const;
};

const getFormattedLabel = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
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
        default:
            return rangeLabel;
    }
};

interface GraphRangeSelectorProps {
    onSelectedRange?: (range: GraphRange) => void;
    isLive?: boolean;
    isLoading?: boolean;
    onLiveChange?: (isLive: boolean) => void;
    showLiveOption?: boolean;
    liveTooltipContent?: ReactNode;
}

export const GraphRangeSelector = ({
    onSelectedRange,
    isLive = false,
    isLoading = false,
    onLiveChange,
    showLiveOption = false,
    liveTooltipContent,
}: GraphRangeSelectorProps) => {
    const { selectedRange, setSelectedRange } = useGraph();
    const ranges = getRanges();
    const options = [
        ...(showLiveOption
            ? [
                  {
                      label: liveTooltipContent ? (
                          <Tooltip content={liveTooltipContent} hasIcon as="span">
                              <span>Live</span>
                          </Tooltip>
                      ) : (
                          'Live'
                      ),
                      value: 'live',
                  },
              ]
            : []),
        ...ranges.map(range => ({
            label: getFormattedLabel(range.label),
            value: range.label,
        })),
    ];

    return (
        <Row gap={16} alignItems="center">
            <SelectBar
                size="small"
                data-testid="@graph/range-selector"
                selectedOption={showLiveOption && isLive ? 'live' : selectedRange.label}
                options={options}
                onChange={selectedLabel => {
                    if (selectedLabel === 'live') {
                        onLiveChange?.(true);

                        return;
                    }

                    const range = ranges.find(({ label }) => label === selectedLabel);
                    if (!range) {
                        return;
                    }

                    onLiveChange?.(false);
                    setSelectedRange(range);
                    if (onSelectedRange) {
                        onSelectedRange(range);
                    }
                }}
            />
            {isLoading && <Spinner size={32} isDisabled={true} />}
        </Row>
    );
};
