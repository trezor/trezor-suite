import { useState } from 'react';

import {
    differenceInMonths,
    endOfToday,
    startOfDay,
    startOfToday,
    subDays,
    subMonths,
    subYears,
} from 'date-fns';

import { Translation } from '@suite/intl';
import {
    Popover,
    type PopoverPlacement,
    Row,
    SelectBar,
    Spinner,
    Timerange,
} from '@trezor/components';

import { useGraph, useLocales } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

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
    { label: 'all', startDate: null, endDate: null, groupBy: 'month' },
] as const;

const CUSTOM_RANGE_LABEL = 'range';

const getFormattedLabel = (rangeLabel: GraphRange['label']) => {
    switch (rangeLabel) {
        case 'all':
            return <Translation id="TR_ALL" />;
        case 'range':
            return <Translation id="TR_RANGE" />;
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
    isDisabled?: boolean;
    isLoading?: boolean;
    placement?: PopoverPlacement;
}

export const GraphRangeSelector = ({
    onSelectedRange,
    isDisabled = false,
    isLoading = false,
    placement,
}: GraphRangeSelectorProps) => {
    const { selectedRange, setSelectedRange } = useGraph();
    const locale = useLocales();
    const [customTimerangeStart, setCustomTimerangeStart] = useState<Date>();
    const [customTimerangeEnd, setCustomTimerangeEnd] = useState<Date>();
    const [isCustomRangePickerOpen, setIsCustomRangePickerOpen] = useState(false);

    const clearCustomTimerange = () => {
        setCustomTimerangeStart(undefined);
        setCustomTimerangeEnd(undefined);
    };

    const setCustomTimerange = (startDate: Date, endDate: Date) => {
        setCustomTimerangeStart(startDate);
        setCustomTimerangeEnd(endDate);

        const range: GraphRange = {
            label: CUSTOM_RANGE_LABEL,
            startDate,
            endDate,
            groupBy: differenceInMonths(startDate, endDate) <= 1 ? 'day' : 'month',
        };

        setSelectedRange(range);
        onSelectedRange?.(range);
        setIsCustomRangePickerOpen(false);
    };

    const handleCancelCustomTimerange = () => {
        setIsCustomRangePickerOpen(false);
    };

    const handleCustomRangePickerOpenChange = (isOpen: boolean) => {
        setIsCustomRangePickerOpen(isOpen);
    };

    return (
        <Popover
            isOpen={isCustomRangePickerOpen}
            onOpenChange={handleCustomRangePickerOpenChange}
            placement={placement ?? { position: 'bottom', alignment: 'start' }}
            content={
                <Timerange
                    onSubmit={(startDate: Date, endDate: Date) =>
                        setCustomTimerange(startDate, endDate)
                    }
                    startDate={customTimerangeStart}
                    endDate={customTimerangeEnd}
                    onCancel={handleCancelCustomTimerange}
                    ctaSubmit={<Translation id="TR_CONFIRM" />}
                    ctaCancel={<Translation id="TR_CANCEL" />}
                    locale={locale}
                />
            }
        >
            <Row gap={16} alignItems="center">
                <SelectBar
                    size="small"
                    data-testid="@graph/range-selector"
                    selectedOption={
                        isCustomRangePickerOpen ? CUSTOM_RANGE_LABEL : selectedRange.label
                    }
                    isDisabled={isDisabled}
                    options={[
                        ...RANGES.map(range => ({
                            label: getFormattedLabel(range.label),
                            value: range.label,
                        })),
                        {
                            label: getFormattedLabel(CUSTOM_RANGE_LABEL),
                            value: CUSTOM_RANGE_LABEL,
                        },
                    ]}
                    onOptionClick={selectedLabel => {
                        if (selectedLabel === CUSTOM_RANGE_LABEL) {
                            setIsCustomRangePickerOpen(true);
                        }
                    }}
                    onChange={selectedLabel => {
                        if (selectedLabel === CUSTOM_RANGE_LABEL) {
                            return;
                        }

                        const range = RANGES.find(({ label }) => label === selectedLabel);
                        if (!range) {
                            return;
                        }

                        setIsCustomRangePickerOpen(false);
                        setSelectedRange(range);
                        clearCustomTimerange();

                        onSelectedRange?.(range);
                    }}
                />
                {isLoading && <Spinner size={32} isDisabled={true} />}
            </Row>
        </Popover>
    );
};
