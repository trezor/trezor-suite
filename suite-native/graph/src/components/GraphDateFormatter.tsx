import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointTimestamp: number | null;
};

const WeekFormatter = ({ selectedPointTimestamp }: { selectedPointTimestamp: number | null }) => {
    const { DateTimeFormatter } = useFormatters();

    // Empty space to prevent layout shift
    if (selectedPointTimestamp === null) return <Text> </Text>;

    return <DateTimeFormatter value={new Date(selectedPointTimestamp)} />;
};

const OtherDateFormatter = ({
    selectedPointTimestamp,
}: {
    selectedPointTimestamp: number | null;
}) => {
    const { DateFormatter } = useFormatters();

    if (selectedPointTimestamp === null) return null;

    return <DateFormatter value={new Date(selectedPointTimestamp)} />;
};

const millisecondsPerTwoWeek = 1209600000;

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointTimestamp,
}: GraphDateFormatterProps) => {
    const millisecondElapsedFromFistPoint = new Date().getTime() - firstPointDate.getTime();
    // this check is significantly faster than using date-fns/differenceInWeeks(days)
    const isWeekFormatted = millisecondElapsedFromFistPoint < millisecondsPerTwoWeek;

    const Formatter = isWeekFormatted ? WeekFormatter : OtherDateFormatter;

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Formatter selectedPointTimestamp={selectedPointTimestamp} />
        </Text>
    );
};
