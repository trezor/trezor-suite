import { endOfToday, startOfDay, startOfToday, subDays, subMonths, subYears } from 'date-fns';

import { Translation } from '@suite/intl';
import { Row, SelectBar, Spinner } from '@trezor/components';

import { useGraph } from 'src/hooks/suite';
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
        // no default
    }
};

interface GraphRangeSelectorProps {
    onSelectedRange?: (range: GraphRange) => void;
    isDisabled?: boolean;
    isLoading?: boolean;
}

export const GraphRangeSelector = ({
    onSelectedRange,
    isDisabled = false,
    isLoading = false,
}: GraphRangeSelectorProps) => {
    const { selectedRange, setSelectedRange } = useGraph();

    return (
        <Row gap={16} alignItems="center">
            <SelectBar
                size="small"
                data-testid="@graph/range-selector"
                selectedOption={selectedRange.label}
                isDisabled={isDisabled}
                options={RANGES.map(range => ({
                    label: getFormattedLabel(range.label),
                    value: range.label,
                }))}
                onChange={selectedLabel => {
                    const range = RANGES.find(({ label }) => label === selectedLabel);
                    if (!range) {
                        return;
                    }

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
